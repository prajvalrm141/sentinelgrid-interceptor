package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type DispatchAlert struct {
	TransactionID      string  `json:"transaction_id"`
	RiskScore          float32 `json:"risk_score"`
	H3Index            string  `json:"h3_index"`
	TargetJurisdiction string  `json:"target_jurisdiction"`
	AutomatedHold      bool    `json:"automated_hold"`
}

type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan DispatchAlert
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mutex      sync.Mutex
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan DispatchAlert),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			fmt.Println("[Go Dispatcher] Client terminal connected to live alert stream.")

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
				fmt.Println("[Go Dispatcher] Client terminal disconnected.")
			}
			h.mutex.Unlock()

		case alert := <-h.broadcast:
			h.mutex.Lock()
			for client := range h.clients {
				err := client.WriteJSON(alert)
				if err != nil {
					log.Printf("WebSocket error: %v", err)
					client.Close()
					delete(h.clients, client)
				}
			}
			h.mutex.Unlock()
		}
	}
}

var hub = newHub()

func handleWebSockets(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade WS connection: %v", err)
		return
	}
	hub.register <- ws

	go func() {
		defer func() {
			hub.unregister <- ws
		}()
		for {
			_, _, err := ws.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}

func handleDispatchAlert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var alert DispatchAlert
	err := json.NewDecoder(r.Body).Decode(&alert)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hub.broadcast <- alert

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"DISPATCHED"}`))
	fmt.Printf("[Go Dispatcher] Broadcasted alert for Tx: %s to active terminals\n", alert.TransactionID)
}

func main() {
	go hub.run()

	http.HandleFunc("/ws", handleWebSockets)
	http.HandleFunc("/api/v1/dispatch", handleDispatchAlert)

	fmt.Println("Go WebSocket Dispatcher running on http://0.0.0.0:8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}

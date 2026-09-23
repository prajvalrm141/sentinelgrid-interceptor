# python_gnn/model.py
import h3
import torch
import torch.nn as nn

class CyberCrimeGNN(nn.Module):
    def __init__(self):
        super(CyberCrimeGNN, self).__init__()
        # For this prototype, we use a deterministic tensor evaluation 
        self.fc = nn.Linear(3, 1)

    def forward(self, amount: float, hop_count: int, velocity: float) -> float:
        # Convert inputs to a PyTorch tensor
        x = torch.tensor([amount, float(hop_count), velocity], dtype=torch.float32)
        
        # Simulate neural network graph topological evaluation
        risk_tensor = torch.sigmoid( (x[1] * 0.4) + (x[2] * 0.5) - 2.0 )
        return float(risk_tensor.item())

def get_h3_index(lat: float, lng: float, resolution: int = 10) -> str:
    """
    Converts raw floating-point coordinates to a discrete 64-bit Uber H3 Hexagon ID.
    """
    return h3.latlng_to_cell(lat, lng, resolution)
import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)
db = client.reusedb

# Pydantic models
class ItemCreate(BaseModel):
    title: str
    description: str
    category: str
    condition: str
    contact_info: str
    contact_method: str
    image_url: Optional[str] = None
    item_type: str  # "give_away" or "barter"
    barter_wants: Optional[str] = None

class Item(BaseModel):
    id: str
    title: str
    description: str
    category: str
    condition: str
    contact_info: str
    contact_method: str
    image_url: Optional[str] = None
    item_type: str
    barter_wants: Optional[str] = None
    created_at: datetime
    status: str = "available"

class DisposalQuery(BaseModel):
    item_name: str
    category: str

# Database operations
def get_items_collection():
    return db.items

@app.get("/")
async def root():
    return {"message": "Household Reuse Platform API", "status": "running"}

@app.get("/api/items", response_model=List[Item])
async def get_items(
    category: Optional[str] = None,
    item_type: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all available items with optional filtering"""
    try:
        collection = get_items_collection()
        filter_query = {"status": "available"}
        
        if category:
            filter_query["category"] = category
        if item_type:
            filter_query["item_type"] = item_type
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        items = list(collection.find(filter_query).sort("created_at", -1))
        
        # Convert MongoDB documents to Pydantic models
        result = []
        for item in items:
            item["id"] = item["_id"]
            del item["_id"]
            result.append(Item(**item))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching items: {e}")
        raise HTTPException(status_code=500, detail="Error fetching items")

@app.post("/api/items", response_model=Item)
async def create_item(item: ItemCreate):
    """Create a new item listing"""
    try:
        collection = get_items_collection()
        
        item_dict = item.dict()
        item_dict["id"] = str(uuid.uuid4())
        item_dict["created_at"] = datetime.utcnow()
        item_dict["status"] = "available"
        
        # Set _id to the same as id for MongoDB
        item_dict["_id"] = item_dict["id"]
        
        result = collection.insert_one(item_dict)
        
        if result.inserted_id:
            # Return the created item
            del item_dict["_id"]
            return Item(**item_dict)
        else:
            raise HTTPException(status_code=500, detail="Failed to create item")
            
    except Exception as e:
        logger.error(f"Error creating item: {e}")
        raise HTTPException(status_code=500, detail="Error creating item")

@app.get("/api/items/{item_id}", response_model=Item)
async def get_item(item_id: str):
    """Get a specific item by ID"""
    try:
        collection = get_items_collection()
        item = collection.find_one({"_id": item_id})
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item["id"] = item["_id"]
        del item["_id"]
        return Item(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching item")

@app.put("/api/items/{item_id}/status")
async def update_item_status(item_id: str, status: str):
    """Update item status (available, claimed, completed)"""
    try:
        collection = get_items_collection()
        
        valid_statuses = ["available", "claimed", "completed"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        result = collection.update_one(
            {"_id": item_id},
            {"$set": {"status": status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
            
        return {"message": "Status updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating item status {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating item status")

@app.post("/api/disposal-guidance")
async def get_disposal_guidance(query: DisposalQuery):
    """Get disposal guidance for non-reusable items"""
    try:
        # Simple disposal guidance database
        disposal_guide = {
            "electronics": {
                "methods": ["E-waste recycling centers", "Manufacturer take-back programs", "Best Buy recycling"],
                "tips": "Remove personal data before disposal. Many electronics contain valuable materials that can be recycled.",
                "warning": "Never throw electronics in regular trash - they contain toxic materials."
            },
            "furniture": {
                "methods": ["Donation centers", "Habitat for Humanity ReStore", "Bulk trash pickup"],
                "tips": "Check with local charities first. Many furniture pieces can be refurbished.",
                "warning": "Large furniture may require special pickup arrangements."
            },
            "clothing": {
                "methods": ["Textile recycling bins", "Goodwill", "H&M recycling program"],
                "tips": "Even damaged clothing can often be recycled into new textiles.",
                "warning": "Don't throw textiles in regular trash - they can be recycled even if not wearable."
            },
            "appliances": {
                "methods": ["Appliance stores (when buying new)", "Scrap metal recycling", "Municipal pickup"],
                "tips": "Many retailers will haul away old appliances when delivering new ones.",
                "warning": "Refrigerators and air conditioners need special handling for refrigerants."
            },
            "books": {
                "methods": ["Libraries", "Schools", "Little Free Libraries", "Paper recycling"],
                "tips": "Consider donating to schools or libraries first. Even damaged books can be recycled.",
                "warning": "Remove any personal information before donating."
            },
            "default": {
                "methods": ["Check local recycling guidelines", "Contact waste management", "Search Earth911.com"],
                "tips": "When in doubt, contact your local waste management authority for guidance.",
                "warning": "Research proper disposal methods to avoid environmental harm."
            }
        }
        
        category_lower = query.category.lower()
        guidance = disposal_guide.get(category_lower, disposal_guide["default"])
        
        return {
            "item": query.item_name,
            "category": query.category,
            "disposal_methods": guidance["methods"],
            "tips": guidance["tips"],
            "warnings": guidance["warning"]
        }
        
    except Exception as e:
        logger.error(f"Error getting disposal guidance: {e}")
        raise HTTPException(status_code=500, detail="Error getting disposal guidance")

@app.get("/api/stats")
async def get_stats():
    """Get platform statistics"""
    try:
        collection = get_items_collection()
        
        total_items = collection.count_documents({})
        available_items = collection.count_documents({"status": "available"})
        completed_items = collection.count_documents({"status": "completed"})
        
        return {
            "total_listings": total_items,
            "available_items": available_items,
            "items_rehomed": completed_items,
            "waste_diverted_kg": completed_items * 2.5  # Estimated average
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error getting stats")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
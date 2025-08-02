import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Search, Plus, Heart, Recycle, Users, Package, Phone, Mail, MessageSquare, Filter, MapPin, Clock } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState({});
  
  // Form states
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    contact_info: '',
    contact_method: 'email',
    image_url: '',
    item_type: 'give_away',
    barter_wants: ''
  });

  const [disposalQuery, setDisposalQuery] = useState({
    item_name: '',
    category: ''
  });
  
  const [disposalGuidance, setDisposalGuidance] = useState(null);

  const categories = [
    'Electronics', 'Furniture', 'Clothing', 'Books', 'Appliances', 
    'Toys', 'Sports', 'Kitchen', 'Garden', 'Other'
  ];

  const conditions = ['Like New', 'Good', 'Fair', 'Poor'];

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory, selectedType]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.item_type === selectedType);
    }

    setFilteredItems(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const createdItem = await response.json();
        setItems([createdItem, ...items]);
        setNewItem({
          title: '',
          description: '',
          category: '',
          condition: '',
          contact_info: '',
          contact_method: 'email',
          image_url: '',
          item_type: 'give_away',
          barter_wants: ''
        });
        alert('Item listed successfully!');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error creating item. Please try again.');
    }
  };

  const handleDisposalQuery = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/disposal-guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(disposalQuery),
      });

      if (response.ok) {
        const guidance = await response.json();
        setDisposalGuidance(guidance);
      }
    } catch (error) {
      console.error('Error getting disposal guidance:', error);
    }
  };

  const ItemCard = ({ item }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
          <Badge variant={item.item_type === 'give_away' ? 'secondary' : 'outline'}>
            {item.item_type === 'give_away' ? 'Free' : 'Barter'}
          </Badge>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.condition}
          </Badge>
        </div>

        {item.item_type === 'barter' && item.barter_wants && (
          <p className="text-sm text-blue-600 mb-3">
            <strong>Wants:</strong> {item.barter_wants}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(item.created_at).toLocaleDateString()}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{item.title}</DialogTitle>
                <DialogDescription>Contact information for this item</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {item.contact_method === 'email' ? (
                    <Mail className="w-4 h-4" />
                  ) : item.contact_method === 'phone' ? (
                    <Phone className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  <span className="font-medium">{item.contact_method}:</span>
                  <span>{item.contact_info}</span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
                {item.item_type === 'barter' && item.barter_wants && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm"><strong>Looking for:</strong> {item.barter_wants}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1584473457406-6240486418e9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxzdXN0YWluYWJsZSUyMGxpdmluZ3xlbnwwfHx8fDE3NTQxNDY0MDR8MA&ixlib=rb-4.1.0&q=85"
            alt="Sustainable living"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-blue-900/60"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              ReUse<span className="text-green-400">Hub</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Turn your unwanted items into someone else's treasure. Connect, share, and reduce waste in your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
                Start Sharing
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg">
                Browse Items
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.total_listings || 0}</div>
              <div className="text-gray-600">Total Listings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.available_items || 0}</div>
              <div className="text-gray-600">Available Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.items_rehomed || 0}</div>
              <div className="text-gray-600">Items Rehomed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{Math.round(stats.waste_diverted_kg || 0)}kg</div>
              <div className="text-gray-600">Waste Diverted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse Items
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              List Item
            </TabsTrigger>
            <TabsTrigger value="disposal" className="flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              Disposal Guide
            </TabsTrigger>
          </TabsList>

          {/* Browse Items Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="give_away">Free Items</SelectItem>
                      <SelectItem value="barter">Barter Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-t-lg"></div>
                    <div className="bg-white p-4 rounded-b-lg">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="flex gap-2 mb-3">
                        <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        <div className="h-5 w-12 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          {/* List Item Tab */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>List Your Item</CardTitle>
                <CardDescription>
                  Share items you no longer need with your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Item Title *</Label>
                      <Input
                        id="title"
                        required
                        value={newItem.title}
                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                        placeholder="e.g., Vintage Armchair"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        required
                        value={newItem.category} 
                        onValueChange={(value) => setNewItem({...newItem, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select 
                        required
                        value={newItem.condition} 
                        onValueChange={(value) => setNewItem({...newItem, condition: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map(cond => (
                            <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item_type">Listing Type *</Label>
                      <Select 
                        required
                        value={newItem.item_type} 
                        onValueChange={(value) => setNewItem({...newItem, item_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="give_away">Give Away (Free)</SelectItem>
                          <SelectItem value="barter">Barter (Trade)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      required
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="Describe your item, its condition, and any other relevant details..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={newItem.image_url}
                      onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {newItem.item_type === 'barter' && (
                    <div className="space-y-2">
                      <Label htmlFor="barter_wants">What are you looking for? (Optional)</Label>
                      <Input
                        id="barter_wants"
                        value={newItem.barter_wants}
                        onChange={(e) => setNewItem({...newItem, barter_wants: e.target.value})}
                        placeholder="e.g., Kitchen appliances, Books, Tools..."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact_method">Contact Method *</Label>
                      <Select 
                        required
                        value={newItem.contact_method} 
                        onValueChange={(value) => setNewItem({...newItem, contact_method: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="message">Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_info">Contact Information *</Label>
                      <Input
                        id="contact_info"
                        required
                        value={newItem.contact_info}
                        onChange={(e) => setNewItem({...newItem, contact_info: e.target.value})}
                        placeholder="your@email.com or phone number"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    List Item
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disposal Guide Tab */}
          <TabsContent value="disposal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Get Disposal Guidance</CardTitle>
                  <CardDescription>
                    Find the best way to dispose of items that can't be reused
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDisposalQuery} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_name">Item Name</Label>
                      <Input
                        id="item_name"
                        required
                        value={disposalQuery.item_name}
                        onChange={(e) => setDisposalQuery({...disposalQuery, item_name: e.target.value})}
                        placeholder="e.g., Old laptop"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="disposal_category">Category</Label>
                      <Select 
                        required
                        value={disposalQuery.category} 
                        onValueChange={(value) => setDisposalQuery({...disposalQuery, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Get Disposal Guidance
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {disposalGuidance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Disposal Guidance for {disposalGuidance.item}</CardTitle>
                    <CardDescription>Category: {disposalGuidance.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Disposal Methods:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {disposalGuidance.disposal_methods.map((method, index) => (
                          <li key={index} className="text-sm">{method}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">Tips:</h4>
                      <p className="text-sm">{disposalGuidance.tips}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Important:</h4>
                      <p className="text-sm text-yellow-700">{disposalGuidance.warnings}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">ReUse<span className="text-green-400">Hub</span></h3>
              <p className="text-gray-300">
                Connecting communities to reduce waste and share resources.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Browse Items</li>
                <li>List Items</li>
                <li>Disposal Guide</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-300">
                <li>How it Works</li>
                <li>Safety Tips</li>
                <li>Success Stories</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Report Issue</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ReUseHub. Building sustainable communities through sharing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
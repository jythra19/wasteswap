import requests
import sys
import json
from datetime import datetime

class ReUseHubAPITester:
    def __init__(self, base_url="https://d408a17f-8d1a-4602-86cd-76fcd113f3f9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_get_items_empty(self):
        """Test getting items when database is empty"""
        success, response = self.run_test("Get Items (Empty)", "GET", "api/items", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} items")
        return success

    def test_get_stats_initial(self):
        """Test getting initial stats"""
        success, response = self.run_test("Get Stats (Initial)", "GET", "api/stats", 200)
        if success:
            expected_keys = ['total_listings', 'available_items', 'items_rehomed', 'waste_diverted_kg']
            for key in expected_keys:
                if key not in response:
                    print(f"   Warning: Missing key '{key}' in stats response")
        return success

    def test_create_item(self):
        """Test creating a new item"""
        test_item = {
            "title": "Vintage Armchair",
            "description": "Beautiful vintage armchair in good condition. Perfect for reading corner.",
            "category": "Furniture",
            "condition": "Good",
            "contact_info": "test@example.com",
            "contact_method": "email",
            "image_url": "https://example.com/chair.jpg",
            "item_type": "give_away",
            "barter_wants": None
        }
        
        success, response = self.run_test("Create Item", "POST", "api/items", 200, data=test_item)
        if success and 'id' in response:
            self.created_item_id = response['id']
            print(f"   Created item with ID: {self.created_item_id}")
        return success

    def test_get_specific_item(self):
        """Test getting a specific item by ID"""
        if not self.created_item_id:
            print("❌ Skipping - No item ID available")
            return False
            
        return self.run_test(
            "Get Specific Item", 
            "GET", 
            f"api/items/{self.created_item_id}", 
            200
        )

    def test_get_items_with_filters(self):
        """Test getting items with various filters"""
        tests = [
            ("Filter by Category", {"category": "Furniture"}),
            ("Filter by Type", {"item_type": "give_away"}),
            ("Search by Title", {"search": "Vintage"}),
            ("Search by Description", {"search": "reading"})
        ]
        
        all_passed = True
        for test_name, params in tests:
            success, response = self.run_test(
                f"Get Items - {test_name}", 
                "GET", 
                "api/items", 
                200, 
                params=params
            )
            if success and isinstance(response, list):
                print(f"   Found {len(response)} items with filter")
            all_passed = all_passed and success
            
        return all_passed

    def test_create_barter_item(self):
        """Test creating a barter item"""
        barter_item = {
            "title": "Old Laptop",
            "description": "Working laptop, a bit slow but good for basic tasks.",
            "category": "Electronics",
            "condition": "Fair",
            "contact_info": "555-1234",
            "contact_method": "phone",
            "item_type": "barter",
            "barter_wants": "Kitchen appliances or books"
        }
        
        return self.run_test("Create Barter Item", "POST", "api/items", 200, data=barter_item)

    def test_disposal_guidance(self):
        """Test disposal guidance endpoint"""
        disposal_queries = [
            {"item_name": "Old laptop", "category": "Electronics"},
            {"item_name": "Broken chair", "category": "Furniture"},
            {"item_name": "Worn clothes", "category": "Clothing"},
            {"item_name": "Unknown item", "category": "Other"}
        ]
        
        all_passed = True
        for query in disposal_queries:
            success, response = self.run_test(
                f"Disposal Guidance - {query['category']}", 
                "POST", 
                "api/disposal-guidance", 
                200, 
                data=query
            )
            if success:
                expected_keys = ['item', 'category', 'disposal_methods', 'tips', 'warnings']
                for key in expected_keys:
                    if key not in response:
                        print(f"   Warning: Missing key '{key}' in disposal response")
                        all_passed = False
            all_passed = all_passed and success
            
        return all_passed

    def test_get_stats_after_items(self):
        """Test getting stats after creating items"""
        success, response = self.run_test("Get Stats (After Items)", "GET", "api/stats", 200)
        if success:
            print(f"   Total listings: {response.get('total_listings', 'N/A')}")
            print(f"   Available items: {response.get('available_items', 'N/A')}")
            print(f"   Items rehomed: {response.get('items_rehomed', 'N/A')}")
            print(f"   Waste diverted: {response.get('waste_diverted_kg', 'N/A')}kg")
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        tests = [
            ("Non-existent Item", "GET", "api/items/non-existent-id", 404, None),
            ("Invalid Item Creation", "POST", "api/items", 422, {"title": ""}),  # Missing required fields
        ]
        
        all_passed = True
        for test_name, method, endpoint, expected_status, data in tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, data)
            all_passed = all_passed and success
            
        return all_passed

def main():
    print("🚀 Starting ReUseHub API Testing...")
    print("=" * 50)
    
    tester = ReUseHubAPITester()
    
    # Run all tests
    test_results = []
    
    test_results.append(("Root Endpoint", tester.test_root_endpoint()))
    test_results.append(("Get Items (Empty)", tester.test_get_items_empty()))
    test_results.append(("Get Stats (Initial)", tester.test_get_stats_initial()))
    test_results.append(("Create Item", tester.test_create_item()))
    test_results.append(("Get Specific Item", tester.test_get_specific_item()))
    test_results.append(("Get Items with Filters", tester.test_get_items_with_filters()))
    test_results.append(("Create Barter Item", tester.test_create_barter_item()))
    test_results.append(("Disposal Guidance", tester.test_disposal_guidance()))
    test_results.append(("Get Stats (After Items)", tester.test_get_stats_after_items()))
    test_results.append(("Invalid Endpoints", tester.test_invalid_endpoints()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📈 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the backend implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
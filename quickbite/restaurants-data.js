// ═══════════════════════════════════════════════════════════════
// QUICKBITE — REAL RESTAURANT DATABASE
// 6 Cities • 4-5 Restaurants each • 6-8 menu items per restaurant
// ═══════════════════════════════════════════════════════════════

const CITY_RESTAURANTS = {
    "una": [
        { id:101, name:"Grand Shiva Restaurant", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Pure Veg", rating:4.5, time:"25-30 min", priceRange:"₹₹", tag:"Popular", offer:"10% OFF", isVeg:true, avgPrice:130,
          menu:[
            {name:"Gujarati Thali",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal, sabzi, roti, rice, papad, sweet",isVeg:true},
            {name:"Paneer Butter Masala",price:160,image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop",desc:"Creamy paneer in rich tomato gravy",isVeg:true},
            {name:"Dal Fry with Rice",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Yellow dal tadka served with steamed rice",isVeg:true},
            {name:"Masala Dosa",price:90,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Crispy dosa with spiced potato filling",isVeg:true},
            {name:"Chole Bhature",price:110,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spicy chickpea curry with fried bread",isVeg:true},
            {name:"Gulab Jamun (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Soft milk dumplings in cardamom syrup",isVeg:true}
        ]},
        { id:102, name:"Ajmeri Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Non-Veg • Biryani", rating:4.3, time:"30-35 min", priceRange:"₹₹₹", tag:"Top Rated", offer:"15% OFF", isVeg:false, avgPrice:200,
          menu:[
            {name:"Chicken Biryani",price:199,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Fragrant basmati rice with spiced chicken",isVeg:false},
            {name:"Butter Chicken",price:220,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Tender chicken in buttery tomato gravy",isVeg:false},
            {name:"Mutton Rogan Josh",price:280,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Kashmiri style slow-cooked mutton curry",isVeg:false},
            {name:"Paneer Tikka",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Chargrilled paneer with mint chutney",isVeg:true},
            {name:"Dal Makhani",price:150,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Slow-cooked black lentils in cream",isVeg:true},
            {name:"Naan Basket",price:60,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Butter naan + garlic naan combo",isVeg:true}
        ]},
        { id:103, name:"Shalimar Hotel", image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=120&h=120&fit=crop",
          cuisine:"Fast Food • Snacks • Chinese", rating:4.0, time:"15-20 min", priceRange:"₹", tag:"Quick Bites", offer:"20% OFF", isVeg:false, avgPrice:110,
          menu:[
            {name:"Veg Burger",price:80,image:"https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=300&h=200&fit=crop",desc:"Crispy paneer patty with fresh veggies",isVeg:true},
            {name:"Chicken Burger",price:120,image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",desc:"Grilled chicken with cheese & sauce",isVeg:false},
            {name:"Hakka Noodles",price:100,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Stir-fried vegetable noodles",isVeg:true},
            {name:"French Fries",price:70,image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",desc:"Crispy golden salted fries",isVeg:true},
            {name:"Manchurian Dry",price:110,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Crispy veg balls in spicy sauce",isVeg:true},
            {name:"Cold Coffee",price:60,image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop",desc:"Chilled coffee with ice cream",isVeg:true}
        ]},
        { id:104, name:"Radhe Krishna Dining", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"South Indian • Pure Veg", rating:4.4, time:"20-25 min", priceRange:"₹", tag:"Healthy", offer:"", isVeg:true, avgPrice:85,
          menu:[
            {name:"Masala Dosa",price:80,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Crispy crepe with spiced potato filling",isVeg:true},
            {name:"Idli Sambar (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Steamed rice cakes with lentil soup",isVeg:true},
            {name:"Uttapam",price:90,image:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",desc:"Thick pancake topped with onion & tomato",isVeg:true},
            {name:"Pav Bhaji",price:100,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spiced mashed veggies with buttered pav",isVeg:true},
            {name:"Medu Vada (3 pcs)",price:70,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Crispy lentil donuts with chutney",isVeg:true},
            {name:"Filter Coffee",price:40,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Traditional South Indian filter coffee",isVeg:true}
        ]},
        { id:105, name:"Shreeji Kathiyawadi", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Kathiyawadi • Gujarati", rating:4.2, time:"25-35 min", priceRange:"₹₹", tag:"Regional", offer:"", isVeg:true, avgPrice:140,
          menu:[
            {name:"Kathiyawadi Thali",price:200,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Traditional platter with bajra roti, ringna batata, kadhi",isVeg:true},
            {name:"Sev Tameta Nu Shaak",price:100,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Tangy tomato curry with crispy sev",isVeg:true},
            {name:"Undhiyu",price:160,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Mixed vegetable curry — winter specialty",isVeg:true},
            {name:"Bajra Rotla",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Millet flatbread with ghee",isVeg:true},
            {name:"Chaas (Buttermilk)",price:30,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk — refreshing",isVeg:true},
            {name:"Mohanthal",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Traditional besan sweet with nuts",isVeg:true}
        ]}
    ],
    "bhiwani": [
        { id:201, name:"Choudhary Dhaba", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Haryanvi • North Indian", rating:4.2, time:"25-30 min", priceRange:"₹₹", tag:"Local Favorite", offer:"10% OFF", isVeg:false, avgPrice:150,
          menu:[
            {name:"Desi Ghee Thali",price:200,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Full thali cooked in pure desi ghee",isVeg:true},
            {name:"Butter Chicken",price:220,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Classic punjabi butter chicken",isVeg:false},
            {name:"Kadhi Chawal",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Yogurt curry with pakodas & rice",isVeg:true},
            {name:"Tandoori Roti (2 pcs)",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Clay oven baked wheat roti",isVeg:true},
            {name:"Churma",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crushed wheat sweet with ghee",isVeg:true},
            {name:"Lassi (Sweet)",price:50,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Thick Haryanvi lassi with malai",isVeg:true}
        ]},
        { id:202, name:"Royal Darbar", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Kebabs • Biryani", rating:4.4, time:"30-40 min", priceRange:"₹₹₹", tag:"Premium", offer:"20% OFF", isVeg:false, avgPrice:230,
          menu:[
            {name:"Mutton Biryani",price:250,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Dum-cooked biryani with tender mutton",isVeg:false},
            {name:"Seekh Kebab (6 pcs)",price:180,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Minced mutton kebabs on skewers",isVeg:false},
            {name:"Paneer Tikka",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Chargrilled paneer with mint chutney",isVeg:true},
            {name:"Chicken Korma",price:230,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Creamy cashew-based chicken curry",isVeg:false},
            {name:"Rumali Roti",price:40,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Thin handkerchief bread",isVeg:true},
            {name:"Gulab Jamun (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Warm milk dumplings in cardamom syrup",isVeg:true}
        ]},
        { id:203, name:"Bhiwani Fast Food", image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
          cuisine:"Burgers • Pizza • Shakes", rating:3.9, time:"15-20 min", priceRange:"₹", tag:"Fast", offer:"", isVeg:false, avgPrice:100,
          menu:[
            {name:"Aloo Tikki Burger",price:60,image:"https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=300&h=200&fit=crop",desc:"Spiced potato patty burger",isVeg:true},
            {name:"Chicken Pizza",price:180,image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",desc:"Loaded chicken & cheese pizza",isVeg:false},
            {name:"Loaded Cheese Fries",price:90,image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",desc:"Cheese fries with jalapeños",isVeg:true},
            {name:"Chocolate Shake",price:80,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Thick chocolate milkshake",isVeg:true},
            {name:"Garlic Bread",price:70,image:"https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=300&h=200&fit=crop",desc:"Buttery garlic bread with herbs",isVeg:true},
            {name:"Paneer Wrap",price:100,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Grilled paneer in a wheat wrap",isVeg:true}
        ]},
        { id:204, name:"Haryana Haveli", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Punjabi • Haryanvi • Thali", rating:4.1, time:"25-35 min", priceRange:"₹₹", tag:"Family", offer:"15% OFF", isVeg:false, avgPrice:160,
          menu:[
            {name:"Haryanvi Non-Veg Thali",price:250,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Chicken, dal, roti, rice, raita, sweet",isVeg:false},
            {name:"Sarson Ka Saag",price:130,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Mustard greens with makki roti",isVeg:true},
            {name:"Tandoori Chicken (Half)",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Marinated clay oven roasted chicken",isVeg:false},
            {name:"Bajra Khichdi",price:100,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Millet porridge with ghee — comfort food",isVeg:true},
            {name:"Rabri",price:70,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Thickened sweetened milk dessert",isVeg:true},
            {name:"Masala Chaas",price:40,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk with cumin",isVeg:true}
        ]}
    ],
    "new delhi": [
        { id:301, name:"Karim's", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Old Delhi • Mughlai • Since 1913", rating:4.6, time:"30-40 min", priceRange:"₹₹₹", tag:"Iconic", offer:"", isVeg:false, avgPrice:300,
          menu:[
            {name:"Mutton Burrah",price:350,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Jama Masjid's legendary mutton chops",isVeg:false},
            {name:"Chicken Jahangiri",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Royal Mughal chicken curry",isVeg:false},
            {name:"Mutton Biryani",price:300,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Authentic Old Delhi style biryani",isVeg:false},
            {name:"Seekh Kebab",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Minced meat skewers from tandoor",isVeg:false},
            {name:"Dal Makhani",price:180,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"24-hour slow-cooked black lentils",isVeg:true},
            {name:"Kheer",price:80,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Rice pudding with dry fruits",isVeg:true}
        ]},
        { id:302, name:"Haldiram's", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Chaat • Sweets • Pure Veg", rating:4.3, time:"15-20 min", priceRange:"₹₹", tag:"Trusted", offer:"10% OFF", isVeg:true, avgPrice:140,
          menu:[
            {name:"Chole Bhature",price:130,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spicy chickpeas with fluffy fried bread",isVeg:true},
            {name:"Pani Puri (6 pcs)",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with tangy spiced water",isVeg:true},
            {name:"Raj Kachori",price:90,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Giant kachori with chutneys & yogurt",isVeg:true},
            {name:"Aloo Tikki Chaat",price:80,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy potato patties with toppings",isVeg:true},
            {name:"Rasgulla (4 pcs)",price:80,image:"https://images.unsplash.com/photo-1645696301019-30a58e1a5e2d?w=300&h=200&fit=crop",desc:"Bengali cottage cheese balls in syrup",isVeg:true},
            {name:"Masala Dosa",price:110,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"South Indian crepe with potato masala",isVeg:true}
        ]},
        { id:303, name:"Moti Mahal Delux", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Tandoori • Butter Chicken Origin", rating:4.5, time:"25-35 min", priceRange:"₹₹₹", tag:"Heritage", offer:"15% OFF", isVeg:false, avgPrice:280,
          menu:[
            {name:"Butter Chicken (OG)",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"The original — invented here in 1950s",isVeg:false},
            {name:"Tandoori Chicken (Full)",price:400,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Iconic clay oven roasted whole chicken",isVeg:false},
            {name:"Dal Moti Mahal",price:200,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Signature creamy black dal",isVeg:true},
            {name:"Paneer Tikka Masala",price:220,image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop",desc:"Paneer in spiced tomato-cream gravy",isVeg:true},
            {name:"Naan Basket",price:80,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Butter, garlic & plain naan combo",isVeg:true},
            {name:"Kulfi Falooda",price:120,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Traditional kulfi with falooda noodles",isVeg:true}
        ]},
        { id:304, name:"Sagar Ratna", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"South Indian • Pure Veg", rating:4.2, time:"20-25 min", priceRange:"₹₹", tag:"Healthy", offer:"", isVeg:true, avgPrice:130,
          menu:[
            {name:"Paper Masala Dosa",price:120,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Extra crispy thin dosa with masala",isVeg:true},
            {name:"Rava Idli (4 pcs)",price:90,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Semolina idlis with coconut chutney",isVeg:true},
            {name:"Mysore Masala Dosa",price:130,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Dosa with red chutney & potato",isVeg:true},
            {name:"Uttapam",price:100,image:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",desc:"Thick pancake with onion & veggies",isVeg:true},
            {name:"Sambar Vada (2 pcs)",price:80,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Lentil donuts soaked in sambar",isVeg:true},
            {name:"Filter Coffee",price:50,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Authentic South Indian filter coffee",isVeg:true}
        ]}
    ],
    "mumbai": [
        { id:401, name:"Bademiya", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Kebabs • Rolls • Street Legend", rating:4.4, time:"20-30 min", priceRange:"₹₹", tag:"Iconic", offer:"10% OFF", isVeg:false, avgPrice:200,
          menu:[
            {name:"Chicken Seekh Roll",price:150,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Minced chicken kebab wrapped in roomali",isVeg:false},
            {name:"Mutton Boti Kebab",price:250,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Juicy mutton pieces from tandoor",isVeg:false},
            {name:"Chicken Tikka",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Spiced boneless chicken from clay oven",isVeg:false},
            {name:"Paneer Tikka Roll",price:130,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Grilled paneer wrapped in roti",isVeg:true},
            {name:"Bhuna Gosht",price:280,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Dry roasted mutton — spicy & rich",isVeg:false},
            {name:"Roomali Roti",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Paper-thin bread",isVeg:true}
        ]},
        { id:402, name:"Swati Snacks", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Gujarati Snacks • Pure Veg", rating:4.6, time:"20-25 min", priceRange:"₹₹", tag:"Premium Veg", offer:"", isVeg:true, avgPrice:150,
          menu:[
            {name:"Panki Chatni",price:120,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Rice flour pancake steamed in banana leaf",isVeg:true},
            {name:"Dhokla",price:80,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Steamed gram flour cake with green chutney",isVeg:true},
            {name:"Sev Puri (6 pcs)",price:90,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with sev & chutneys",isVeg:true},
            {name:"Dal Dhokli",price:160,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Gujarati dal with wheat flour dumplings",isVeg:true},
            {name:"Handvo",price:100,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Savory mixed lentil cake",isVeg:true},
            {name:"Mango Lassi",price:100,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Chilled mango yogurt drink",isVeg:true}
        ]},
        { id:403, name:"Britannia & Co.", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Parsi • Iranian • Since 1923", rating:4.5, time:"30-40 min", priceRange:"₹₹₹", tag:"Heritage", offer:"15% OFF", isVeg:false, avgPrice:300,
          menu:[
            {name:"Berry Pulao",price:380,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Signature Parsi rice with berries & mutton",isVeg:false},
            {name:"Sali Boti",price:320,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Parsi mutton with crispy potato straws",isVeg:false},
            {name:"Dhansak",price:280,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Lentil & meat curry — Parsi classic",isVeg:false},
            {name:"Caramel Custard",price:100,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Classic wobbly Parsi caramel pudding",isVeg:true},
            {name:"Raspberry Soda",price:60,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Iconic house-made raspberry drink",isVeg:true},
            {name:"Patra Ni Machhi",price:300,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Fish wrapped in banana leaf with chutney",isVeg:false}
        ]},
        { id:404, name:"Shree Thaker Bhojanalay", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Pure Veg", rating:4.5, time:"25-30 min", priceRange:"₹₹", tag:"Authentic", offer:"", isVeg:true, avgPrice:180,
          menu:[
            {name:"Unlimited Gujarati Thali",price:350,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal, shaak, roti, rice, farsan, sweet — unlimited",isVeg:true},
            {name:"Vada Pav (2 pcs)",price:40,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Mumbai's iconic street snack",isVeg:true},
            {name:"Pav Bhaji",price:110,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spiced mashed veggies with buttered pav",isVeg:true},
            {name:"Bombay Sandwich",price:80,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Classic Mumbai street sandwich with chutney",isVeg:true},
            {name:"Shrikhand",price:80,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Sweet strained yogurt with saffron",isVeg:true},
            {name:"Masala Chai",price:30,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Strong spiced tea — cutting chai style",isVeg:true}
        ]}
    ],
    "ahmedabad": [
        { id:501, name:"Manek Chowk Food Stalls", image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=120&h=120&fit=crop",
          cuisine:"Street Food • Chaat • Night Market", rating:4.3, time:"15-20 min", priceRange:"₹", tag:"Famous", offer:"", isVeg:true, avgPrice:80,
          menu:[
            {name:"Khaman Dhokla",price:50,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Fluffy steamed gram flour snack",isVeg:true},
            {name:"Dabeli",price:30,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Sweet-spicy potato pav with pomegranate",isVeg:true},
            {name:"Sev Khamani",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crumbled dhokla with sev & chutney",isVeg:true},
            {name:"Pani Puri (6 pcs)",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with spiced water",isVeg:true},
            {name:"Kulhad Pizza",price:100,image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",desc:"Manek Chowk special — pizza in clay cup",isVeg:true},
            {name:"Mango Gola",price:30,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Crushed ice with mango syrup",isVeg:true}
        ]},
        { id:502, name:"Gordhan Thal", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Premium", rating:4.5, time:"25-35 min", priceRange:"₹₹₹", tag:"Premium", offer:"10% OFF", isVeg:true, avgPrice:250,
          menu:[
            {name:"Royal Gujarati Thali",price:400,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"25+ items — dal, sabzi, roti, rice, farsan, mithai",isVeg:true},
            {name:"Undhiyu",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Mixed winter vegetable speciality",isVeg:true},
            {name:"Khandvi",price:100,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Gram flour rolls with tempering",isVeg:true},
            {name:"Methi Thepla",price:60,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Fenugreek flatbread with chaas",isVeg:true},
            {name:"Basundi",price:90,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Thickened sweet milk with dry fruits",isVeg:true},
            {name:"Chaas Masala",price:40,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk — Gujarati style",isVeg:true}
        ]},
        { id:503, name:"Das Khaman House", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Farsan • Snacks • Pure Veg", rating:4.4, time:"10-15 min", priceRange:"₹", tag:"Quick", offer:"20% OFF", isVeg:true, avgPrice:70,
          menu:[
            {name:"Das Special Khaman",price:60,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Signature soft khaman with tempering",isVeg:true},
            {name:"Sandwich Dhokla",price:80,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Layered dhokla with green chutney",isVeg:true},
            {name:"Fafda Jalebi",price:70,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crispy gram flour strips with sweet jalebi",isVeg:true},
            {name:"Kachori (2 pcs)",price:50,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Stuffed fried pastry — spicy filling",isVeg:true},
            {name:"Gathiya",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy gram flour sticks — tea-time snack",isVeg:true},
            {name:"Masala Chai",price:20,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Strong Gujarati tea with spices",isVeg:true}
        ]},
        { id:504, name:"Lucky Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Chinese • Punjabi • Multi-cuisine", rating:4.1, time:"20-30 min", priceRange:"₹₹", tag:"All-rounder", offer:"", isVeg:false, avgPrice:160,
          menu:[
            {name:"Chicken Manchurian",price:180,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Indo-Chinese chicken in spicy sauce",isVeg:false},
            {name:"Veg Fried Rice",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Wok-tossed rice with vegetables",isVeg:true},
            {name:"Paneer Chilli",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Crispy paneer in Indo-Chinese sauce",isVeg:true},
            {name:"Hakka Noodles",price:110,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Stir-fried noodles with veggies",isVeg:true},
            {name:"Sweet Corn Soup",price:80,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Thick creamy sweet corn soup",isVeg:true},
            {name:"Brownie with Ice Cream",price:120,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Warm chocolate brownie with vanilla",isVeg:true}
        ]}
    ],
    "jaipur": [
        { id:601, name:"Laxmi Mishthan Bhandar (LMB)", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Rajasthani • Sweets • Since 1727", rating:4.5, time:"20-25 min", priceRange:"₹₹", tag:"Heritage", offer:"10% OFF", isVeg:true, avgPrice:150,
          menu:[
            {name:"Rajasthani Thali",price:250,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal baati churma, gatte, papad, sweet",isVeg:true},
            {name:"Dal Baati Churma",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Rajasthan's signature dish — 3 baatis with dal & churma",isVeg:true},
            {name:"Ghevar",price:120,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Disc-shaped Rajasthani sweet — festival special",isVeg:true},
            {name:"Pyaz Kachori",price:50,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Flaky pastry with spicy onion filling",isVeg:true},
            {name:"Paneer Ghevar",price:100,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Unique paneer-stuffed ghevar",isVeg:true},
            {name:"Malpua (2 pcs)",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Deep-fried sweet pancakes with rabri",isVeg:true}
        ]},
        { id:602, name:"Rawat Mishthan Bhandar", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Kachori • Sweets • Famous", rating:4.4, time:"15-20 min", priceRange:"₹", tag:"Must Try", offer:"", isVeg:true, avgPrice:80,
          menu:[
            {name:"Pyaz Ki Kachori",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Jaipur's #1 — flaky onion kachori",isVeg:true},
            {name:"Mawa Kachori",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Sweet kachori filled with mawa — unique",isVeg:true},
            {name:"Mirchi Vada",price:30,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Stuffed chilli fritter — spicy snack",isVeg:true},
            {name:"Samosa (2 pcs)",price:30,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy potato-filled triangles",isVeg:true},
            {name:"Rabri Jalebi",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crispy jalebi soaked in thick rabri",isVeg:true},
            {name:"Lassi (Sweet)",price:50,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Thick malai lassi — Rajasthani style",isVeg:true}
        ]},
        { id:603, name:"Handi Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Tandoori • Non-Veg", rating:4.3, time:"30-40 min", priceRange:"₹₹₹", tag:"Popular", offer:"15% OFF", isVeg:false, avgPrice:250,
          menu:[
            {name:"Handi Chicken",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Signature clay pot chicken curry",isVeg:false},
            {name:"Mutton Biryani",price:260,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Aromatic dum biryani with tender mutton",isVeg:false},
            {name:"Laal Maas",price:300,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Fiery Rajasthani red mutton curry",isVeg:false},
            {name:"Tandoori Platter",price:350,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Mixed grill — chicken, seekh, fish tikka",isVeg:false},
            {name:"Dal Makhani",price:160,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Rich slow-cooked black lentils",isVeg:true},
            {name:"Kulfi",price:70,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Traditional Indian ice cream with pistachios",isVeg:true}
        ]},
        { id:604, name:"Tapri Central", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Cafe • Chai • Snacks", rating:4.2, time:"10-15 min", priceRange:"₹", tag:"Trending", offer:"", isVeg:true, avgPrice:100,
          menu:[
            {name:"Tapri Special Chai",price:40,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Signature spiced tea — the star menu",isVeg:true},
            {name:"Bun Maska",price:50,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Soft bread bun with butter — classic",isVeg:true},
            {name:"Maggi (Cheese)",price:80,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Loaded cheese Maggi noodles",isVeg:true},
            {name:"Veg Sandwich",price:70,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Grilled veggie sandwich with chutney",isVeg:true},
            {name:"Cold Coffee",price:90,image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop",desc:"Chilled coffee with ice cream",isVeg:true},
            {name:"Cutting Chai (2 cups)",price:30,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Half-glass strong tea — share & sip",isVeg:true}
        ]}
    ]
};

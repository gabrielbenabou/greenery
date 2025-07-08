import { createClient } from "@supabase/supabase-js";

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role key for admin access

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"; // UUID format for gabilevy.1@hotmail.com

async function createMockData() {
    console.log("Creating mock data for user:", MOCK_USER_ID);

    // Add some raw products
    const rawProducts = [
        {
            user_id: MOCK_USER_ID,
            product_type: "Flower-Buds",
            strain_name: "Blue Dream",
            source: "Local Dispensary",
            quality_notes: "High quality indoor grown, dense buds with good trichome coverage",
            thc_content: 22.5,
            current_amount: 3.5,
            original_amount: 3.5,
            unit: "g",
            cost: 35.00,
            purchase_date: "2024-01-15",
            created_at: new Date().toISOString(),
        },
        {
            user_id: MOCK_USER_ID,
            product_type: "Hash",
            strain_name: "OG Kush Hash",
            source: "Friend",
            quality_notes: "Bubble hash, good quality, sticky texture",
            thc_content: 45.0,
            current_amount: 1.2,
            original_amount: 2.0,
            unit: "g",
            cost: 40.00,
            purchase_date: "2024-01-10",
            created_at: new Date().toISOString(),
        },
        {
            user_id: MOCK_USER_ID,
            product_type: "Flower-Buds",
            strain_name: "Northern Lights",
            source: "Online Store",
            quality_notes: "Classic indica, great for evening use, earthy smell",
            thc_content: 18.5,
            current_amount: 0.8,
            original_amount: 7.0,
            unit: "g",
            cost: 50.00,
            purchase_date: "2024-01-05",
            created_at: new Date().toISOString(),
        }
    ];

    // Add some consumables
    const consumables = [
        {
            user_id: MOCK_USER_ID,
            consumable_type: "Gummies",
            name: "Blue Dream Gummies",
            quantity: 15,
            grams_per_unit: 0.1,
            cost: 25.00,
            created_at: new Date().toISOString(),
        },
        {
            user_id: MOCK_USER_ID,
            consumable_type: "Cartridges",
            name: "OG Kush Cart",
            quantity: 1,
            grams_per_unit: 0.5,
            cost: 35.00,
            created_at: new Date().toISOString(),
        },
        {
            user_id: MOCK_USER_ID,
            consumable_type: "Johnnies",
            name: "Pre-rolled Joints",
            quantity: 5,
            grams_per_unit: 0.75,
            cost: 40.00,
            created_at: new Date().toISOString(),
        }
    ];

    try {
        // Insert raw products
        const { error: rawProductsError } = await supabase
            .from("raw_products")
            .insert(rawProducts);

        if (rawProductsError) {
            console.error("Error inserting raw products:", rawProductsError);
        } else {
            console.log("✅ Raw products inserted successfully");
        }

        // Insert consumables
        const { error: consumablesError } = await supabase
            .from("consumables")
            .insert(consumables);

        if (consumablesError) {
            console.error("Error inserting consumables:", consumablesError);
        } else {
            console.log("✅ Consumables inserted successfully");
        }

        console.log("🎉 Mock data creation completed!");

    } catch (error) {
        console.error("Error creating mock data:", error);
    }
}

// Run the script
createMockData();

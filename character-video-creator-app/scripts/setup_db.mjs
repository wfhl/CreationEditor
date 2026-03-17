import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres:VYu8n705XSzM2dvt@db.icoqzhhfhejfzhowxsom.supabase.co:5432/postgres";
const schemaPath = "combined_schema.sql";
const sql = fs.readFileSync(schemaPath, 'utf8');

const client = new Client({ connectionString });

async function run() {
    try {
        await client.connect();
        console.log("Connected to Supabase DB successfully!");

        await client.query(sql);
        console.log("SQL Schema setup executed successfully.");
    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();

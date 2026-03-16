import dotenv from "dotenv"
import { createClient } from '@supabase/supabase-js'
import type {Database} from './database.types'

dotenv.config()

const supabaseURL = process.env.SECRET_DATABASE_CONNECTION
const supabaseKEY = process.env.SECRET_DATABASE_KEY

if (!supabaseURL || !supabaseKEY) {
    throw new Error("Missing Supabase key or url in .env")
}

const supabase = createClient<Database>(supabaseURL, supabaseKEY)


export default supabase
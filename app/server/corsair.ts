import 'dotenv/config';
import { createCorsair } from 'corsair';
import { pool } from '@/db/index'
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';


export const corsair = createCorsair({
    plugins: [gmail(),googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Iniciando sembrado de datos...");

    const adminEmail = 'admin@geoportal.gov';
    const rawPassword = 'admin123';
    
    // Generar un ID de 20 dígitos aleatorios
    const generateId = () => {
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    };

    try {
        const adminExists = await prisma.usuario.findUnique({
            where: { correo: adminEmail }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(rawPassword, 10);
            
            await prisma.usuario.create({
                data: {
                    id: generateId(),
                    nombreCompleto: 'Administrador del Sistema',
                    direccion: 'Oficina Central Geoportal',
                    correo: adminEmail,
                    contrasena: hashedPassword,
                    rol: 'ADMIN'
                }
            });

            console.log(`✅ Usuario Administrador creado: ${adminEmail} / ${rawPassword}`);
        } else {
            console.log("⚠️ El usuario administrador ya existe.");
        }
    } catch (err) {
        console.error("Error durante el sembrado:", err);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        pool.end();
    });

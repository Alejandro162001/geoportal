const prisma = require('./src/db');

async function test() {
  try {
    const users = await prisma.usuario.findMany({ where: { softDelete: false } });
    console.log('Users found:', users.length);
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

test();

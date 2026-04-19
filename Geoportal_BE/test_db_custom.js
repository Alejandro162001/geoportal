const prisma = require('./src/db');
async function test() {
  try {
    const users = await prisma.usuario.findMany({ where: { softDelete: false } });
    console.log('Success! Users found with softDelete filter:', users.length);
    process.exit(0);
  } catch (err) {
    console.error('Failure! Error details:', err);
    process.exit(1);
  }
}
test();

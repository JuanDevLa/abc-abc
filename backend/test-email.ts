import { sendOrderConfirmationEmail } from './src/lib/mailer.js';

await sendOrderConfirmationEmail({
  orderNumber: 'JR-TEST-0001',
  firstName: 'Juan',
  lastName: 'Clemente',
  email: 'juanclemente2608@gmail.com',
  address: 'Calle Ejemplo 123',
  city: 'Villaflores',
  state: 'Chiapas',
  zipCode: '29300',
  shippingMethod: 'standard',
  shippingCents: 9900,
  subtotalCents: 149900,
  totalCents: 159800,
  items: [{
    productName: 'Jersey Barcelona 24/25',
    variantSize: 'L',
    variantColor: 'Azul',
    quantity: 1,
    unitPriceCents: 149900,
    productImageUrl: null,
  }],
});

console.log('✅ Email enviado — revisa tu bandeja');

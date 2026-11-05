export const adminLinks = [
  { to: '/admin-dashboard', label: 'Events' },
  { to: '/admin-analytics', label: 'Reports' },
  { to: '/payment-confirmation', label: 'Payment Confirmation' },
];
export const studentLinks = (cartLength) => [
  { to: '/student-dashboard', label: 'Events' },
  { to: '/my-payments', label: 'My Payments' },
  { to: '/cart', label: cartLength != null ? `Cart (${cartLength})` : 'Cart' },
];

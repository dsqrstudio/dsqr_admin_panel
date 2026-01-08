// admin/config/menu.js
// Single source-of-truth for sidebar items (no react-icons here)
export const MENU = [
  { id: 'dashboard', label: 'Dashboard' },
  {
    id: 'home',
    label: 'Home',
    sub: ['Primary Graphics', 'Portfolio Video', 'Services Offered'],
  },
  { id: 'clients', label: 'Client Logos' },
  {
    id: 'videos',
    label: 'Videos',
    sub: ['Portfolio Video', 'Service Offered'],
  },
  {
    id: 'graphics',
    label: 'Graphics',
    sub: ['Primary Images', 'Service Offered Images'],
  },
  { id: 'team', label: 'Team Photos' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'testimonials', label: 'Testimonials' },
  {
    id: 'ourwork',
    label: 'Our Work',
    sub: ['Featured Projects', 'Before/After Video'],
  },
  {
    id: 'ai',
    label: 'AI',
    sub: ['Primary Graphics', 'Service Offered Images'],
  },
  { id: 'affiliates', label: 'Affiliates' },
  { id: 'about', label: 'About Us' },
  { id: 'settings', label: 'Settings' },
]

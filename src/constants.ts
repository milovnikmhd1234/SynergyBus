/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TicketType {
  id: string;
  name: string;
  price: number;
  category: 'base' | 'discount' | 'special';
  color: string;
}

export const TICKETS: TicketType[] = [
  { id: '1', name: 'Základní 30 min', price: 30, category: 'base', color: 'bg-emerald-600' },
  { id: '2', name: 'Základní 60 min', price: 40, category: 'base', color: 'bg-emerald-600' },
  { id: '3', name: 'Základní 90 min', price: 50, category: 'base', color: 'bg-emerald-600' },
  { id: '4', name: 'Zlevněná 30 min', price: 15, category: 'discount', color: 'bg-amber-600' },
  { id: '5', name: 'Zlevněná 60 min', price: 20, category: 'discount', color: 'bg-amber-600' },
  { id: '6', name: 'Zlevněná 90 min', price: 25, category: 'discount', color: 'bg-amber-600' },
  { id: '7', name: 'Senior / ZTP', price: 0, category: 'discount', color: 'bg-amber-600' },
  { id: '8', name: 'Zavazadlo', price: 20, category: 'special', color: 'bg-sky-600' },
  { id: '9', name: 'Pes', price: 20, category: 'special', color: 'bg-sky-600' },
  { id: '10', name: 'Přestupní denní', price: 120, category: 'base', color: 'bg-indigo-600' },
];

export const STOPS = [
  'Hlavní nádraží',
  'Náměstí Svobody',
  'Zelný trh',
  'Mendlovo náměstí',
  'Česká',
  'Konečného náměstí',
  'Technologický park',
];

export const LINE_INFO = {
  number: '12',
  destination: 'Technologický park',
  driver: 'Jan Novák',
  vehicleId: '7412',
};

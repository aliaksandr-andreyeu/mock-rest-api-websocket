import { faker } from "@faker-js/faker";
import type { Order, User, UserStatus } from "../types.js";

export function fakeUser(partial?: Partial<User>): User {
  const status: UserStatus = faker.helpers.arrayElement(["active", "blocked", "pending"]);
  return {
    id: partial?.id ?? faker.string.uuid(),
    email: partial?.email ?? faker.internet.email(),
    name: partial?.name ?? faker.person.fullName(),
    status: partial?.status ?? status,
    createdAt: partial?.createdAt ?? faker.date.past().toISOString()
  };
}

export function fakeOrder(partial?: Partial<Order>): Order {
  return {
    id: partial?.id ?? faker.string.uuid(),
    userId: partial?.userId ?? faker.string.uuid(),
    total: partial?.total ?? faker.number.float({ min: 5, max: 5000, fractionDigits: 2 }),
    currency: partial?.currency ?? faker.finance.currencyCode(),
    itemsCount: partial?.itemsCount ?? faker.number.int({ min: 1, max: 12 }),
    createdAt: partial?.createdAt ?? faker.date.recent({ days: 30 }).toISOString()
  };
}

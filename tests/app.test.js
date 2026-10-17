const test = require("node:test");
const assert = require("node:assert/strict");
const { getUser } = require("../modules/user");
const { calculateTotal } = require("../modules/order");

test("user module returns a user", () => {
  assert.deepEqual(getUser(1), { id: 1, name: "Demo User" });
});

test("order module calculates the total", () => {
  assert.equal(
    calculateTotal([
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ]),
    35
  );
});

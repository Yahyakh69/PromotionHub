// Manual definition of the Convex API to avoid build errors when _generated is missing
export const api = {
  skus: {
    get: "skus:get",
    create: "skus:create",
    createBatch: "skus:createBatch",
    update: "skus:update",
    remove: "skus:remove",
    removeBatch: "skus:removeBatch",
  },
  partners: {
    get: "partners:get",
    create: "partners:create",
    update: "partners:update",
    remove: "partners:remove",
  },
  users: {
    get: "appUsers:get",
    create: "appUsers:create",
    update: "appUsers:update",
    remove: "appUsers:remove",
  },
  promotions: {
    get: "promotions:get",
    create: "promotions:create",
    update: "promotions:update",
    remove: "promotions:remove",
  },
  sales: {
    get: "sales:get",
    submit: "sales:submit",
    update: "sales:update",
  },
} as any;
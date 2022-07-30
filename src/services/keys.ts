export const pageCacheKey = (id: string) => `pageCache#${id}`;

export const usersKey = (userId: string) => `users#${userId}`;

export const usernamesKey = () => `usernames`;

export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`;

export const usernamesUniqueKey = () => `usernames:unique`;

export const userLikesKey = (userId: string) => `users:likes#${userId}`;

// items
export const itemsKey = (itemId: string) => `items#${itemId}`;
export const itemsByViewsKey = () => `items:views`;
export const itemsByPriceKey = () => `items:price`;
export const itemsByEndingAtKey = () => `items:endingAt`;
export const itemsViewsKey = (itemId: string) => `item:views#${itemId}`;
export const bidHistoryKey = (itemId: string) => `history#${itemId}`;

// index
export const itemsIndexKey = () => 'idx:items';

import { vi } from "vitest";

// React.cache chỉ có trong bản server của React; trong môi trường test chỉ cần trả lại hàm gốc.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));

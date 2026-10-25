import type { Topology } from "topojson-specification";

const cache = new Map<string, Promise<Topology>>();

function loadTopology(url: string): Promise<Topology> {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetch(url).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ${url}: HTTP ${String(res.status)}`);
      }
      return (await res.json()) as Topology;
    });
    // A failed request must not stay cached, or every later call would
    // replay the same rejection instead of trying again.
    promise.catch(() => {
      cache.delete(url);
    });
    cache.set(url, promise);
  }
  return promise;
}

/** Counties and the national outline. */
export function loadCountiesTopology(): Promise<Topology> {
  return loadTopology("/data/map/counties-10t.json");
}

/** Towns, counties and the national outline. */
export function loadTownsTopology(): Promise<Topology> {
  return loadTopology("/data/map/towns-10t.json");
}

import * as text from "../../../../kit/text.js";

/** Where a path tier is in its life cycle. */
export type PathTierStatus = "requested" | "granted" | "revoked" | "expired";

/** One path tier, with what the planners need to act on it. */
export class PathTier {
  code: string;
  title: string;
  ratio: number;
  limit: number;
  name: string;
  version: number;
  windowDays: number;
  status: PathTierStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    limit: number,
    name: string,
    version: number,
    windowDays: number,
    status: PathTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.limit = limit;
    this.name = name;
    this.version = version;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PathTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round(this.version * this.windowDays * 100) / 100;
  }

  copy(): PathTier {
    return new PathTier(
      this.code,
      this.title,
      this.ratio,
      this.limit,
      this.name,
      this.version,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path tier in status requested. */
export function newPathTier(code: string, title: string): PathTier {
  return new PathTier(code, title, 0, 0, "", 0, 0, "requested");
}

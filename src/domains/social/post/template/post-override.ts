import * as text from "../../../../kit/text.js";

/** Where a post override is in its life cycle. */
export type PostOverrideStatus = "created" | "validated" | "published" | "retired";

/** A post override. Its code is unique within a tenant. */
export class PostOverride {
  code: string;
  title: string;
  ratio: number;
  durationMinutes: number;
  active: boolean;
  createdAt: number;
  floorValue: number;
  status: PostOverrideStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    durationMinutes: number,
    active: boolean,
    createdAt: number,
    floorValue: number,
    status: PostOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.active = active;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"post override"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.createdAt + this.floorValue) * 100) / 100;
  }

  copy(): PostOverride {
    return new PostOverride(
      this.code,
      this.title,
      this.ratio,
      this.durationMinutes,
      this.active,
      this.createdAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a post override in status created. */
export function newPostOverride(code: string, title: string): PostOverride {
  return new PostOverride(code, title, 0, 0, false, 0, 0, "created");
}

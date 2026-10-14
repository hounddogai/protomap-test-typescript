import * as text from "../../../../kit/text.js";

/** Where a post tier is in its life cycle. */
export type PostTierStatus = "created" | "validated" | "published" | "retired";

/** A post tier as the post team keeps it. */
export class PostTier {
  code: string;
  name: string;
  label: string;
  visible: boolean;
  score: number;
  expiresAt: number;
  status: PostTierStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    visible: boolean,
    score: number,
    expiresAt: number,
    status: PostTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.score = score;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: PostTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"post tier"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.expiresAt - this.score) * 100) / 100;
  }

  copy(): PostTier {
    return new PostTier(this.code, this.name, this.label, this.visible, this.score, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post tier in status created. */
export function newPostTier(code: string, name: string): PostTier {
  return new PostTier(code, name, "", false, 0, 0, "created");
}

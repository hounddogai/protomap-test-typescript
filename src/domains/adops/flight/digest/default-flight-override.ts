import * as text from "../../../../kit/text.js";

/** Where a default flight override is in its life cycle. */
export type DefaultFlightOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** One default flight override, with what the planners need to act on it. */
export class DefaultFlightOverride {
  code: string;
  name: string;
  pinned: boolean;
  attributes: Map<string, string>;
  ceiling: number;
  visible: boolean;
  channel: string;
  active: boolean;
  status: DefaultFlightOverrideStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    attributes: Map<string, string>,
    ceiling: number,
    visible: boolean,
    channel: string,
    active: boolean,
    status: DefaultFlightOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.visible = visible;
    this.channel = channel;
    this.active = active;
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

  canMoveTo(next: DefaultFlightOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultFlightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default flight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default flight override"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): DefaultFlightOverride {
    return new DefaultFlightOverride(
      this.code,
      this.name,
      this.pinned,
      this.attributes,
      this.ceiling,
      this.visible,
      this.channel,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default flight override in status requested. */
export function newDefaultFlightOverride(code: string, name: string): DefaultFlightOverride {
  return new DefaultFlightOverride(code, name, false, new Map<string, string>(), 0, false, "", false, "requested");
}

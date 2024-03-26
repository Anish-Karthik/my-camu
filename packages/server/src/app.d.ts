// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("./lucia/index.js").Auth;
  type DatabaseUserAttributes = {
    username: string;
  };
  type DatabaseSessionAttributes = {
    username: string;
    displayName: string;
  };
}

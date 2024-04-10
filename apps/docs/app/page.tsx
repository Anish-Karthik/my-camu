"use client";
import { Button } from "@repo/ui/components/ui/button";
import type { App } from "@repo/server";
import { treaty } from "@elysiajs/eden";
import { useEffect, useState } from "react";
import { trpc } from "../lib/utils/trpc";
// @ts-ignore
const api = treaty<App>("localhost:3000", {
  fetch: {
    credentials: "include",
  },
});


const arr = [
  {
    username: "user1",
    password: "password1",
  },
  {
    username: "user2",
    password: "password2",
  },
  {
    username: "admin",
    password: "admin",
  },
];


export default function Page() {
  const greeting = trpc.greeting
  const [csrfToken, setCsrfToken] = useState("");
  useEffect(() => {
    api.index.get().then(response => response.data);
  }, []);
  console.log(csrfToken);
  return (
    <>
      {arr.map((user) => (
        <div key={user.username}>
          <Button
            onClick={() => {
              api.login
                .post({
                  ...user,
                })
                .then((response) => {
                  setCsrfToken(response.data.csrfToken);
                  console.log(response.data);
                  alert(JSON.stringify(response.data));
                  alert(`${user.username} Logged In`);
                })
                .catch((err) => {
                  console.log(err);
                  alert(err);
                });
            }}
          >
            {user.username} login
          </Button>
        </div>
      ))}
      <Button
        onClick={() => {
          api.logout
            .post({
              headers: {
                csrfToken,
              },
            })
            .then(() => {
              alert("Logged out");
              setCsrfToken("");
            })
            .catch((err) => alert(err));
        }}
      >
        Logout
      </Button>
      <Button
        onClick={() => {
          console.log("profile", csrfToken);
          api.profile
            .get({
              headers: {
                csrfToken: csrfToken,
              },
            })
            .then((response) => alert(JSON.stringify(response.data)))
            .catch((err) => alert(err));
        }}
      >
        Profile
      </Button>
    </>
  );
}

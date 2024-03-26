import { auth } from "./index";
import { LuciaError } from "lucia";

export const createUser = async ({
  providerId,
  providerUserId,
  password,
  username,
}: {
  providerId: string;
  providerUserId: string;
  password: string;
  username: string;
}) => {
  try {
    const user = await auth.createUser({
      key: {
        providerId,
        providerUserId,
        password,
      },
      attributes: {
        username,
      }, // expects `Lucia.DatabaseUserAttributes`
    });
  } catch (e) {
    if (e instanceof LuciaError && e.message === `AUTH_DUPLICATE_KEY_ID`) {
      // key already exists
    }
    // provided user attributes violates database rules (e.g. unique constraint)
    // or unexpected database errors
  }
};

export const updateUser = async ({
  userId,
  newUsername,
}: {
  userId: string;
  newUsername: string;
}) => {
  try {
    const user = await auth.updateUserAttributes(
      userId,
      {
        username: newUsername,
      }, // expects partial `Lucia.DatabaseUserAttributes`
    );
    await auth.invalidateAllUserSessions(user.userId); // invalidate all user sessions => logout all sessions
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {
        username: user.username,
        displayName: user.username,
      },
    }); // new session
    // store new session
  } catch (e) {
    if (e instanceof LuciaError && e.message === `AUTH_INVALID_USER_ID`) {
      // invalid user id
    }
    // provided user attributes violates database rules (e.g. unique constraint)
    // or unexpected database errors
  }
};

export const deleteUser = async ({ userId }: { userId: string }) => {
  try {
    await auth.deleteUser(userId);
    await auth.invalidateAllUserSessions(userId); // invalidate all user sessions => logout all sessions
  } catch (e) {
    if (e instanceof LuciaError && e.message === `AUTH_INVALID_USER_ID`) {
      // invalid user id
    }
    // unexpected database errors
  }
};

export const getUser = async ({ userId }: { userId: string }) => {
  try {
    const user = await auth.getUser(userId);
  } catch (e) {
    if (e instanceof LuciaError && e.message === `AUTH_INVALID_USER_ID`) {
      // invalid user id
    }
    // unexpected database errors
  }
}

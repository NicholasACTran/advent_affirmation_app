import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  await client.models.User.create({
      email: event.request.userAttributes.email,
      profileOwner: `${event.request.userAttributes.sub}::${event.userName}`,
  });

  return event;
};
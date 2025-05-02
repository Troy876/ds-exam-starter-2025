import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand,QueryCommand,QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
      try {
          console.log("Event: ", JSON.stringify(event));
          const queryParams = event?.queryStringParameters;
          if (!queryParams) {
              return {
                  statusCode: 500,
                  headers: {
                      "content-type": "application/json",
                  },
                  body: JSON.stringify({ message: "Missing query parameters" }),
              };
          }
          if (!queryParams.movieId) {
              return {
                  statusCode: 500,
                  headers: {
                      "content-type": "application/json",
                  },
                  body: JSON.stringify({ message: "Missing movie Id parameter" }),
              };
          }
          const movieId = parseInt(queryParams?.movieId);
          let commandInput: QueryCommandInput = {
              TableName: process.env.CAST_TABLE_NAME,
          };
          if ("role" in queryParams) {
              commandInput = {
                  ...commandInput,
                  IndexName: "roleIx",
                  KeyConditionExpression: "movieId = :m and begins_with(role, :r) ",
                  ExpressionAttributeValues: {
                      ":m": movieId,
                      ":r": queryParams.role,
                  },
              };
          } else if ("crew" in queryParams) {
              commandInput = {
                  ...commandInput,
                  KeyConditionExpression: "movieId = :m and begins_with(crew, :a) ",
                  ExpressionAttributeValues: {
                      ":m": movieId,
                      ":a": queryParams.crew,
                  },
              };
          } else {
              commandInput = {
                  ...commandInput,
                  KeyConditionExpression: "movieId = :m",
                  ExpressionAttributeValues: {
                      ":m": movieId,
                  },
              };
          }
  
        const commandOutput = await client.send(
              new QueryCommand(commandInput)
          );
  
          return {
              statusCode: 200,
              headers: {
                  "content-type": "application/json",
              },
              body: JSON.stringify({
                  data: commandOutput.Items,
              }),
          };
      } catch (error: any) {
          console.log(JSON.stringify(error));
          return {
              statusCode: 500,
              headers: {
                  "content-type": "application/json",
              },
              body: JSON.stringify({ error }),
          };
      }
  };

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

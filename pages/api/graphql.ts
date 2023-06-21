import { ApolloServer } from "apollo-server-micro";
import { MicroRequest } from "apollo-server-micro/dist/types";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import resolvers from "lib/resolvers";
import typeDefs from "lib/schema";
import { prisma } from "server/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: MicroRequest, res: any) {
  const Server = new ApolloServer({
    schema: makeExecutableSchema({
      resolvers,
      typeDefs,
    }),
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            embed: true,
            graphRef: "plaid-gufzoj@current",
          })
        : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    async context({ req }) {
      return {
        req,
        prisma,
      };
    },
  });
  await Server.start();
  return Server.createHandler({ path: "/api/graphql" })(req, res)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

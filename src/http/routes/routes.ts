import { FastifyInstance } from "fastify";
import { GetPoll } from "./pollRoutes/get-poll";
import { createPoll } from "./pollRoutes/create-poll";
import { VoteOnPoll } from "./pollRoutes/vote-on-poll";
import { PollResults } from "../ws/poll-results";

export async function Routes(app: FastifyInstance){
    app.register(GetPoll)
    app.register(createPoll)
    app.register(VoteOnPoll)
    app.register(PollResults)
}
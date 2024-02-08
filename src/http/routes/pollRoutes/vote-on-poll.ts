import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../../lib/prisma";
import { randomUUID } from "crypto";
import { redis } from "../../../lib/redis";
import { voting } from "../../../utils/voting-pub-sub";

export async function VoteOnPoll(app: FastifyInstance) {
  app.post("/poll/:pollId/votes", async (request, reply) => {
    const VoteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParmas = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParmas.parse(request.params);
    const { pollOptionId } = VoteOnPollBody.parse(request.body);
    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });
      if (
        userPreviousVoteOnPoll &&
        userPreviousVoteOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id,
          },
        });
        const votes = await redis.zincrby(
          pollId,
          -1,
          userPreviousVoteOnPoll.pollOptionId
        );
        voting.publish(pollId, {
          PollOptionId: pollOptionId,
          votes: Number(votes),
        });
      } else if (userPreviousVoteOnPoll) {
        return reply.status(400).send({
          error: "You have already voted on this poll",
        });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();
      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    });

    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, {
      PollOptionId: pollOptionId,
      votes: Number(votes),
    });

    return reply.status(201).send();
  });
}

import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getPlayerDetails = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
    return res.status(400).json({ message: "Player ID is required" });
    }

const parsedId = Number(playerId);
    const player = await prisma.user.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
        stats: {
          select: {
            goals: true,
            assists: true,
            matchesPlayed: true,
            tournamentsPlayed: true,
            cleanSheets: true
          }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    return res.status(200).json({
      id: player.id,
      name: player.name,
      goals: player.stats?.goals ?? 0,
      assists: player.stats?.assists ?? 0,
      matches: player.stats?.matchesPlayed ?? 0,
      tournamentsPlayed: player.stats?.tournamentsPlayed ?? 0
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//Current Form
export const getPlayerCurrentForm = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({ message: "Player ID is required" });
    }

    const parsedId = Number(playerId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid Player ID" });
    }

    // Get player with stats
    const player = await prisma.user.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        stats: {
          select: {
            goals: true,
            assists: true,
            matchesPlayed: true
          }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const totalMatches = player.stats?.matchesPlayed ?? 0;
    const totalGoals = player.stats?.goals ?? 0;
    const totalAssists = player.stats?.assists ?? 0;

    // Find matches player participated in
    const matchParticipations = await prisma.matchPlayer.findMany({
      where: { playerId: parsedId },
      include: {
        match: true
      }
    });

    let wins = 0;

    for (const participation of matchParticipations) {
      const match = participation.match;

      if (match.status !== "FINISHED") continue;

      const isTeamA = match.teamAId === participation.teamId;
      const isTeamB = match.teamBId === participation.teamId;

      if (
        (isTeamA && match.scoreA > match.scoreB) ||
        (isTeamB && match.scoreB > match.scoreA)
      ) {
        wins++;
      }
    }

    const winPercentage =
      totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : "0";

    const goalsPerMatch =
      totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : "0";

    const assistsPerMatch =
      totalMatches > 0 ? (totalAssists / totalMatches).toFixed(2) : "0";

    return res.json({
      winPercentage: Number(winPercentage),
      goalsPerMatch: Number(goalsPerMatch),
      assistsPerMatch: Number(assistsPerMatch)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



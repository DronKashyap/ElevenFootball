import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getTournamentDetails = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({ message: "Tournament ID is required" });
    }

    const parsedId = Number(tournamentId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid Tournament ID" });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
        bannerUrl: true,
        description: true,
        location: true,
        date: true,
        entryFee: true,
        prize: true,
        format: true,
        numberOfTeams: true,
        rules: true,
        facilities: true,
        organiser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileUrl: true
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    return res.status(200).json({
      id: tournament.id,
      name: tournament.name,
      banner: tournament.bannerUrl,
      description: tournament.description,
      location: tournament.location,
      date: tournament.date,
      entry: tournament.entryFee,
      winning: tournament.prize,
      format: tournament.format,
      spots: tournament.numberOfTeams,
      rules: tournament.rules,
      facilities: tournament.facilities,
      organiserDetails: tournament.organiser
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getAllTournaments = async (req: Request, res: Response) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        date: "asc" // upcoming first
      },
      select: {
        id: true,
        name: true,
        date: true,
        numberOfTeams: true,
        prize: true,
        entryFee: true,
        bannerUrl: true,
        location: true,
        _count: {
          select: {
            teams: true
          }
        }
      }
    });

    const formatted = tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      date: tournament.date,
      totalTeams: tournament.numberOfTeams,
      registeredTeams: tournament._count.teams,
      winning: tournament.prize,
      entry: tournament.entryFee,
      banner: tournament.bannerUrl,
      location: tournament.location
    }));

    return res.status(200).json(formatted);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const registerTeamToTournament = async (
  req: Request,
  res: Response
) => {
  try {
    const { tournamentId } = req.params;
    const { teamId } = req.body;

    if (!tournamentId || !teamId) {
      return res.status(400).json({ message: "Tournament ID and Team ID are required" });
    }

    const parsedTournamentId = Number(tournamentId);
    const parsedTeamId = Number(teamId);

    if (isNaN(parsedTournamentId) || isNaN(parsedTeamId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // 1️⃣ Check tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: parsedTournamentId },
      select: {
        id: true,
        numberOfTeams: true,
        _count: {
          select: { teams: true }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // 2️⃣ Check team exists
    const team = await prisma.team.findUnique({
      where: { id: parsedTeamId }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // 3️⃣ Check if already registered
    const existingRegistration = await prisma.tournamentTeam.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId: parsedTournamentId,
          teamId: parsedTeamId
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "Team already registered in this tournament" });
    }

    // 4️⃣ Check if tournament is full
    if (tournament._count.teams >= tournament.numberOfTeams) {
      return res.status(400).json({ message: "Tournament is already full" });
    }

    // 5️⃣ Register team
    const registration = await prisma.tournamentTeam.create({
      data: {
        tournamentId: parsedTournamentId,
        teamId: parsedTeamId,
        paymentStatus: "PENDING"
      }
    });

    return res.status(201).json({
      message: "Team registered successfully",
      registration
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
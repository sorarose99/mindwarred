import { MindPlanet } from './types';

export interface Tournament {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  participants: string[]; // planet IDs
  status: 'scheduled' | 'active' | 'completed';
  winner?: string;
  rounds: TournamentRound[];
}

export interface TournamentRound {
  id: string;
  matches: TournamentMatch[];
  status: 'pending' | 'active' | 'completed';
}

export interface TournamentMatch {
  id: string;
  participants: string[];
  winner?: string;
  startTime?: number;
  duration: number;
}

export class TournamentScheduler {
  private tournaments: Map<string, Tournament> = new Map();
  private scheduledEvents: Map<string, NodeJS.Timeout> = new Map();
  private onTournamentUpdate?: (tournament: Tournament) => void;

  constructor() {
    this.scheduleRegularTournaments();
  }

  private scheduleRegularTournaments(): void {
    // Schedule daily tournaments
    this.scheduleDailyTournament();
    
    // Schedule weekly mega tournament
    this.scheduleWeeklyTournament();
    
    // Schedule hourly quick battles
    this.scheduleHourlyBattles();
  }

  private scheduleDailyTournament(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0); // 8 PM daily

    const timeUntilTournament = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.createTournament('Daily Championship', 3600000, 'elimination'); // 1 hour
      this.scheduleDailyTournament(); // Schedule next day
    }, timeUntilTournament);
  }

  private scheduleWeeklyTournament(): void {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(19, 0, 0, 0); // 7 PM Sunday

    const timeUntilTournament = nextSunday.getTime() - now.getTime();

    setTimeout(() => {
      this.createTournament('Weekly Mega Championship', 7200000, 'elimination'); // 2 hours
      this.scheduleWeeklyTournament(); // Schedule next week
    }, timeUntilTournament);
  }

  private scheduleHourlyBattles(): void {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    const timeUntilBattle = nextHour.getTime() - now.getTime();

    setTimeout(() => {
      this.createTournament('Hourly Skirmish', 900000, 'battle-royale'); // 15 minutes
      this.scheduleHourlyBattles(); // Schedule next hour
    }, timeUntilBattle);
  }

  createTournament(
    name: string, 
    duration: number, 
    format: 'elimination' | 'battle-royale' | 'round-robin',
    participants?: string[]
  ): Tournament {
    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name,
      startTime: Date.now() + 300000, // Start in 5 minutes
      duration,
      participants: participants || [],
      status: 'scheduled',
      rounds: []
    };

    // Generate tournament structure based on format
    switch (format) {
      case 'elimination':
        tournament.rounds = this.generateEliminationRounds(tournament.participants);
        break;
      case 'battle-royale':
        tournament.rounds = this.generateBattleRoyaleRounds(tournament.participants);
        break;
      case 'round-robin':
        tournament.rounds = this.generateRoundRobinRounds(tournament.participants);
        break;
    }

    this.tournaments.set(tournament.id, tournament);

    // Schedule tournament start
    const timeout = setTimeout(() => {
      this.startTournament(tournament.id);
    }, tournament.startTime - Date.now());

    this.scheduledEvents.set(tournament.id, timeout);

    return tournament;
  }

  private generateEliminationRounds(participants: string[]): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    let currentParticipants = [...participants];
    let roundNumber = 1;

    while (currentParticipants.length > 1) {
      const matches: TournamentMatch[] = [];
      const nextRoundParticipants: string[] = [];

      // Pair up participants
      for (let i = 0; i < currentParticipants.length; i += 2) {
        if (i + 1 < currentParticipants.length) {
          matches.push({
            id: `match-${roundNumber}-${i / 2}`,
            participants: [currentParticipants[i], currentParticipants[i + 1]],
            duration: 300000 // 5 minutes per match
          });
        } else {
          // Bye - automatically advance
          nextRoundParticipants.push(currentParticipants[i]);
        }
      }

      rounds.push({
        id: `round-${roundNumber}`,
        matches,
        status: 'pending'
      });

      // Prepare for next round (winners will be added during tournament execution)
      currentParticipants = nextRoundParticipants;
      roundNumber++;
    }

    return rounds;
  }

  private generateBattleRoyaleRounds(participants: string[]): TournamentRound[] {
    return [{
      id: 'battle-royale',
      matches: [{
        id: 'battle-royale-match',
        participants: [...participants],
        duration: 900000 // 15 minutes
      }],
      status: 'pending'
    }];
  }

  private generateRoundRobinRounds(participants: string[]): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    const matches: TournamentMatch[] = [];

    // Generate all possible pairings
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `match-${i}-${j}`,
          participants: [participants[i], participants[j]],
          duration: 300000 // 5 minutes per match
        });
      }
    }

    // Split matches into rounds (max 3 matches per round)
    for (let i = 0; i < matches.length; i += 3) {
      rounds.push({
        id: `round-${Math.floor(i / 3) + 1}`,
        matches: matches.slice(i, i + 3),
        status: 'pending'
      });
    }

    return rounds;
  }

  private startTournament(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return;

    tournament.status = 'active';
    
    // Start first round
    if (tournament.rounds.length > 0) {
      this.startRound(tournament, tournament.rounds[0]);
    }

    this.onTournamentUpdate?.(tournament);
  }

  private startRound(tournament: Tournament, round: TournamentRound): void {
    round.status = 'active';

    // Start all matches in the round
    round.matches.forEach(match => {
      match.startTime = Date.now();
      
      // Schedule match end
      setTimeout(() => {
        this.endMatch(tournament, round, match);
      }, match.duration);
    });

    this.onTournamentUpdate?.(tournament);
  }

  private endMatch(tournament: Tournament, round: TournamentRound, match: TournamentMatch): void {
    // Simulate match result (in real implementation, this would come from battle results)
    const randomWinner = match.participants[Math.floor(Math.random() * match.participants.length)];
    match.winner = randomWinner;

    // Check if round is complete
    const allMatchesComplete = round.matches.every(m => m.winner);
    if (allMatchesComplete) {
      this.endRound(tournament, round);
    }
  }

  private endRound(tournament: Tournament, round: TournamentRound): void {
    round.status = 'completed';

    // Find next round
    const currentRoundIndex = tournament.rounds.indexOf(round);
    const nextRound = tournament.rounds[currentRoundIndex + 1];

    if (nextRound) {
      // Update next round participants with winners
      const winners = round.matches.map(m => m.winner!).filter(Boolean);
      
      // For elimination tournaments, update next round matches
      if (nextRound.matches.length === 1 && winners.length > 1) {
        nextRound.matches[0].participants = winners;
      }

      // Start next round after a short delay
      setTimeout(() => {
        this.startRound(tournament, nextRound);
      }, 30000); // 30 second break between rounds
    } else {
      // Tournament complete
      this.endTournament(tournament);
    }

    this.onTournamentUpdate?.(tournament);
  }

  private endTournament(tournament: Tournament): void {
    tournament.status = 'completed';

    // Determine overall winner
    const finalRound = tournament.rounds[tournament.rounds.length - 1];
    if (finalRound.matches.length > 0) {
      tournament.winner = finalRound.matches[0].winner;
    }

    this.onTournamentUpdate?.(tournament);

    // Clean up
    const timeout = this.scheduledEvents.get(tournament.id);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledEvents.delete(tournament.id);
    }
  }

  joinTournament(tournamentId: string, planetId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== 'scheduled') {
      return false;
    }

    if (!tournament.participants.includes(planetId)) {
      tournament.participants.push(planetId);
      
      // Regenerate rounds with new participant
      if (tournament.participants.length >= 2) {
        tournament.rounds = this.generateEliminationRounds(tournament.participants);
      }
      
      this.onTournamentUpdate?.(tournament);
      return true;
    }

    return false;
  }

  getActiveTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === 'active');
  }

  getUpcomingTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === 'scheduled')
      .sort((a, b) => a.startTime - b.startTime);
  }

  getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  setTournamentUpdateCallback(callback: (tournament: Tournament) => void): void {
    this.onTournamentUpdate = callback;
  }

  // Auto-join planets to upcoming tournaments based on activity
  autoJoinActivePlanets(planets: MindPlanet[]): void {
    const upcomingTournaments = this.getUpcomingTournaments();
    
    upcomingTournaments.forEach(tournament => {
      // Auto-join planets that have been active recently
      planets.forEach(planet => {
        const timeSinceActivity = Date.now() - planet.lastContribution;
        if (timeSinceActivity < 3600000 && // Active in last hour
            tournament.participants.length < 8 && // Tournament not full
            !tournament.participants.includes(planet.id)) {
          this.joinTournament(tournament.id, planet.id);
        }
      });
    });
  }
}
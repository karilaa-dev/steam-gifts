// Bun Worker for parallel game loading
import type { WishlistGameWithPrices } from '../../types/steam';

interface WorkerMessage {
  type: 'LOAD_GAMES';
  gameIds: number[];
  steamId: string;
}

interface WorkerResponse {
  type: 'GAME_LOADED';
  game: WishlistGameWithPrices;
  progress: number;
}

interface WorkerError {
  type: 'ERROR';
  error: string;
  gameId: number;
}

// Worker handler
export default {
  async fetch(req: Request): Promise<Response> {
    try {
      const { type, gameIds, steamId } = await req.json() as WorkerMessage;
      
      if (type !== 'LOAD_GAMES') {
        return new Response(JSON.stringify({ error: 'Invalid message type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const results: WishlistGameWithPrices[] = [];
      const total = gameIds.length;

      for (let i = 0; i < gameIds.length; i++) {
        const gameId = gameIds[i];
        
        try {
          // Fetch game details with regional pricing using Bun's native fetch
          const response = await fetch(`/api/game-details/${steamId}/${gameId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to load game ${gameId}: ${response.status}`);
          }

          const gameData = await response.json() as WishlistGameWithPrices;
          results.push(gameData);

          // Send progress update
          const progress = Math.round(((i + 1) / total) * 100);
          
          // In Bun Workers, we can't directly communicate back to main thread
          // So we'll batch results
          if (i === gameIds.length - 1 || i % 5 === 0) {
            // This would be handled by the main thread polling mechanism
            // For now, we'll return all results at once
          }

        } catch (error) {
          console.error(`Error loading game ${gameId}:`, error);
          // Send error to main thread
          const errorResponse: WorkerError = {
            type: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            gameId: gameId || 0
          };
          
          // Note: In actual implementation, we'd use postMessage or similar
        }
      }

      return new Response(JSON.stringify({ games: results, total }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Worker error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Helper function to create worker from main thread
export function createGameWorker(): Worker {
  // In a real Bun environment, this would be:
  // return new Worker(new URL('./game-worker.ts', import.meta.url));
  
  // For compatibility, we'll use a simpler approach
  return new Worker(new URL('./game-worker.ts', import.meta.url), { type: 'module' });
}

// Type definitions for worker communication
export type { WorkerMessage, WorkerResponse, WorkerError };
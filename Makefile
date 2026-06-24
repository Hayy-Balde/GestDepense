.PHONY: help setup start stop clean

# Couleurs pour l'affichage
GREEN := \033[0;32m
NC := \033[0m

help:
	@echo "Commandes disponibles:"
	@echo "  ${GREEN}make setup${NC}      - Prépare l'environnement complet (Backend & Frontend)"
	@echo "  ${GREEN}make start${NC}      - Démarre le serveur Frontend (Vite)"
	@echo "  ${GREEN}make clean${NC}      - Supprime les dépendances (node_modules, vendor)"

setup:
	@echo "${GREEN}🚀 Préparation du Backend (Laravel)...${NC}"
	@cd backend && [ ! -f .env ] && cp .env.example .env || true
	@cd backend && composer install
	@cd backend && php artisan key:generate
	@cd backend && php artisan migrate:fresh
	@echo "${GREEN}🎨 Fin préparation du backend  (Succès)...${NC}"


	@echo "${GREEN}🎨 Préparation du Frontend (React)...${NC}"
	@cd frontend && [ ! -f .env ] && echo "VITE_API_URL=http://localhost:8000/api/v1" > .env || true
	@cd frontend && npm install

start_front:
	@echo "${GREEN}⚛️ Démarrage de l'interface Frontend...${NC}"
	@cd frontend && npm run dev

start_back:
	@echo "${GREEN}🐳 Démarrage de l'API Backend...${NC}"
	@cd backend && php artisan serve

start:
	tmux kill-session -t dev 2>/dev/null || true
	tmux new-session -d -s dev
# 	tmux send-keys -t dev 'echo "${GREEN}🐳 Démarrage de l\'API Backend...${NC}"' Enter
	tmux send-keys -t dev 'cd backend && php artisan serve' Enter
	tmux split-window -h -t dev
# 	tmux send-keys -t dev 'echo "${GREEN}⚛️ Démarrage de l\'interface Frontend...${NC}"' Enter
	tmux send-keys -t dev 'cd frontend && npm run dev' Enter
	tmux attach -t dev

clear_backend:
	@echo "${GREEN}🐳 Nettoyage de l'API Backend...${NC}"
	@cd backend && php artisan optimize:clear

clean:
	@echo "${GREEN}🧹 Nettoyage des dépendances...${NC}"
	@rm -rf frontend/node_modules
	@rm -f frontend/.env

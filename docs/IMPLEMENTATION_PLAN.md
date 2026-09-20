# Home Infrastructure — план реализации

Согласовано: 2026-09-13. Репозиторий: `geek`.

## Две поддерживаемые версии

Этот документ — основной roadmap на русском: порядок работ, решения и статус.
[Техническая версия на английском](reference/IASC-VSCode-Chat-Guide.md) — обновлённый
существующий guide. Поддерживать обе версии в одном изменении: одинаковые номера
этапов, решения и checklist. При расхождении порядок и статус определяет этот
документ; фактическую конфигурацию — файлы Git и проверка хоста.

## Цель и правила

Постепенно построить переносимую инфраструктуру на Lenovo L590 и перенести её на
HP T640 без переделки архитектуры. Путь deployment — `/opt/home-infra`, без
зависимости от `/home/akeya`.

Операционный режим: всё развёртывание и сопровождение выполняется только через
SSH. Репозиторий клонируется и обновляется непосредственно на целевом хосте;
там же выполняются проверки, `.env`, Docker, настройки, backup, restore,
обновления и миграция. Локальная машина используется только как SSH-клиент и
для просмотра Git-изменений; локальный запуск стека не является допустимым
сценарием.

Один слой → проверка → обновление обеих версий → отдельный commit → следующий слой.
Сначала изучать и переиспользовать существующее. Сохранять работающие Kuma,
WireGuard на AX12, Tailscale, Ollama, SSH/RDP и контейнеры.
Перед удалением данных, пересозданием volumes, изменением рабочих контейнеров,
firewall, routing, VPN или открытием порта явно показать изменение и его влияние.
Безопасные обратимые действия выполнять обычным рабочим процессом.

Git = configuration: Compose, Caddyfile, шаблоны, scripts, `.env.example`, docs.
Backup = persistent data. Secrets = отдельное защищённое хранилище.
Не хранить в Git `.env`, пароли, API/TOTP secrets, приватные ключи и данные БД.

## Проверенное состояние репозитория

Проверено 2026-09-13 локально. Сервисы и хосты не проверялись; сведения о них взяты
из предоставленного плана и существующих документов.

| Хост | Исходные сведения, требующие проверки |
|---|---|
| Lenovo L590 | Ubuntu 24.04; временный infra host; Docker, Kuma, Tailscale, SSH |
| MoralMachine | Windows, RTX 3090; RDP, SSH, Tailscale, Ollama, Wake-on-LAN |
| HP T640 | Будущий основной хост 24/7; готовность не подтверждена |

Ollama: `http://100.84.255.108:11434` или `http://moralmachine:11434`.
Проверять доступ из контейнера отдельно; API остаётся в приватной сети.

```text
geek/
├── compose.yml, .env.example, .gitignore, README.md
├── caddy/             # Caddyfile и заметки
├── authentik/         # заметки настройки
├── guacamole/         # заметки; schema генерируется и исключена из Git
├── postgres/initdb/   # создание БД и загрузка schema
├── kuma/              # заметки и CSS; действующий Kuma вне Compose
├── scripts/           # secrets, schema, backup, restore, migration
└── docs/              # архитектура, deployment, secrets, troubleshooting, планы
```

`open-webui/` отсутствует. `data/` и `backups/` исключены из Git; локального
`backups/` нет, его создаёт backup-скрипт. `/opt/home-infra` на Lenovo не проверен.

## Целевая архитектура и уточнения

```text
Internet → HTTPS :443 → Caddy + проверка Authentik/2FA
                         ├─ Guacamole → RDP/SSH → MoralMachine / Lenovo
                         ├─ Open WebUI → private Ollama → MoralMachine / RTX 3090
                         └─ существующий Uptime Kuma
```

1. Compose уже содержит Caddy, Authentik server/worker, PostgreSQL, Redis,
   Guacamole и guacd. Для этапов 2–3 нужен проверенный приватный запуск выбранного
   слоя: текущий Caddy зависит от Authentik, Guacamole не публикует host port.
2. Цель — наружу только TCP 443. Сейчас Compose публикует 80/443, deployment
   предполагает HTTP-01/redirect. На этапе 4 выбрать и проверить выпуск и
   продление сертификатов для 443-only либо документировать исключение для 80.
   Проверить MEO/AX12, DNS и существующие NAT rules; VPN сохранить.
3. Сохранить нумерацию исходного плана: этап 4 проверяет внешний HTTPS на
   изолированном тестовом ответе Caddy; рабочие приложения публиковать после
   проверки Authentik/2FA на этапе 5.
4. Сохранить текущие маршруты: Authentik на `/`, Guacamole на `/guacamole/`
   с `forward_auth` и отдельным Guacamole login. Для WebUI/Kuma сначала выбрать
   hostname и маршрутизацию; старые примеры guide `/auth/` и незащищённого
   Guacamole больше не использовать.
5. Kuma подключать через proxy к существующему экземпляру после инвентаризации.
   Сохранить ownership, volumes, историю, monitors и Telegram. Отдельно определить
   доступ к dashboard и status pages. Не создавать второй Kuma в Compose.
6. Backup делать перед первым изменением существующих данных; этап 8 завершает
   общую стратегию. Текущий архив включает `.env` и требует шифрования;
   отдельное восстановление secrets ещё предстоит оформить.
7. При restore сначала вернуть secrets и данные/БД, затем запускать приложения.
   Текущий migration-скрипт останавливает Lenovo до проверки T640. Перед этапом
   10 адаптировать процедуру для изолированной проверки цели, согласованного
   финального backup, переключения трафика и отката.

## Статус

Наличие файлов не означает работающий deployment. Все этапы требуют проверки.

- [ ] 1. Repository bootstrap
- [ ] 2. Guacamole local
- [ ] 3. Caddy local
- [ ] 4. External HTTPS
- [ ] 5. Authentik
- [ ] 6. Open WebUI
- [ ] 7. Kuma integration
- [ ] 8. Backup / restore
- [ ] 9. Reproducible deployment
- [ ] 10. HP T640 migration

### 1. Repository bootstrap — частично подготовлен

- [x] Найдены Compose, `.env.example`, `.gitignore`, README, docs и scripts.
- [x] Сопоставлены исходный план и guide; определены две поддерживаемые версии.
- [ ] Через SSH проверить Lenovo: `/opt/home-infra`, Docker/Compose, контейнеры, ownership,
  volumes, сети, занятые порты и расположение данных без вывода secrets.
- [ ] Проверить исключение secrets/data из Git и создание runtime-каталогов на хосте.
- [ ] Подготовить и проверить приватный запуск слоя 2 без всего стека и публичных портов.
- [ ] Проверить diff, записать результаты и сделать отдельный commit этапа.

До завершения bootstrap к Guacamole не переходить.

### 2. Guacamole local

Переиспользовать PostgreSQL, guacd и Guacamole; до первого запуска пустой БД
сгенерировать schema через `scripts/init-guac-schema.sh`. Существующую БД не удалять
ради повторной инициализации. Проверить приватный Web UI, смену стандартного пароля,
RDP/SSH к MoralMachine, желательно SSH к Lenovo, сохранение настроек после restart.
Kuma остаётся работающим.

### 3. Caddy local

В доверенной сети отдельно проверить Caddy → Guacamole: routing, headers,
WebSocket, Docker networking, restart. Подготовить конфигурацию этапа без зависимости
от Authentik, сохранив целевой вариант с `forward_auth`.

### 4. External HTTPS

После локальных проверок инвентаризировать DNS, MEO/AX12 и NAT. Разрешить расхождение
443 против 80/443; проверить сертификат и продление. Проверить изолированный HTTPS
endpoint через мобильный Internet и отсутствие прямой публикации 22, 3389, 11434,
3001, 8080 и PostgreSQL. Записать топологию в `docs/NETWORK.md`.

### 5. Authentik

Настроить provider/application/outpost, login, обязательную 2FA и TOTP recovery
вне хоста; WebAuthn/passkeys — позже. Проверить неавторизованный запрос, разрешённого
и запрещённого пользователя, отсутствие обхода proxy и восстановление доступа.
Только затем открыть рабочий Guacamole через HTTPS.

### 6. Open WebUI

Добавить на infra host, выбрать адрес и интеграцию с Authentik. Использовать
существующий Ollama через private network/Tailscale. Проверить модели, streaming,
persistence после restart, поведение при выключенном MoralMachine и доступ обычным
браузером без VPN-клиента. Не публиковать Ollama 11434.

### 7. Kuma integration

Определить container name, compose ownership, volumes, database/data location,
network и monitors. До изменения сделать backup. Проверить proxy/auth, историю,
monitors, alerts и выбранную политику status pages без пересоздания Kuma.

### 8. Backup / restore

Проверить и переиспользовать `backup.sh` и `restore.sh`. Оформить
`docs/BACKUP_RESTORE.md`: Git configuration, отдельное secure secrets storage,
PostgreSQL, Kuma, WebUI и остальные persistent data; согласованность backup,
шифрование, хранение вне хоста, расписание и retention. Проверить полный restore
на чистой изолированной Ubuntu, включая ошибки восстановления. Наличие архива
не подтверждает restore; покрытие standalone Kuma и будущего WebUI не подтверждено.

### 9. Reproducible deployment

На чистой системе проверить через SSH: clone → secrets → schema/restore → запуск → проверки.
Fresh install и restore описать отдельно. Записать все обязательные ручные шаги,
версии образов и зависимости в README/DEPLOYMENT; перед deployment проверить
совместимость версий. Полный `docker compose up -d` не заменяет поэтапный bootstrap.

### 10. HP T640 migration

Подготовить Ubuntu/Docker и `/opt/home-infra`, clone, восстановить secrets и данные.
Проверить внутренние сервисы изолированно от production. Согласовать остановку
записей и финальный backup, переключить HTTPS после готовности T640, проверить
весь стек. Сохранить Lenovo и данные для отката; вывести из основной роли после
успешной проверки. Оформить `docs/MIGRATION_T640.md` с cutover и rollback.

## Поддержка документации

После проверки этапа записывать дату, среду, результат и ограничения в обе версии,
только затем менять `[ ]` на `[x]`. Обновлять README, ARCHITECTURE и DEPLOYMENT при
изменении поведения. NETWORK, BACKUP_RESTORE и MIGRATION_T640 создавать по мере
появления проверенных сведений, без пустых документов заранее.
`reference/VSCode-Chat-Prompts.md` — библиотека примеров, не третий действующий план.

Следующий шаг: открыть SSH-сессию на Lenovo, завершить инвентаризацию bootstrap и подготовить приватный
запуск выбранного слоя. Эта редакция плана не подтверждает deployment или restore.

# jiractl

A command-line tool for managing Jira.

## Install with
```
npm i @godaddy/jiractl --global
```

## Setup

Add a context for the Jira instance that you use. E.g:

```console
$ jiractl config set-context https://jira.yourteam.com
Username: name
Password:
Context "https://jira.yourteam.com" created.
Set default context to "https://jira.yourteam.com".
```

Add the teams in your project. E.g., for a project named FOO:
```
jiractl setup FOO
```
This will output the team names added.

Some team names are difficult to type or remember on the command line; to alias a team that you use frequently, run:
```
jiractl alias [name] [alias]
```

e.g.
```console
$ jiractl alias "Orange Cats" cats

```
Outputs:
```
Aliased Orange Cats with cats:
 { board: 1234,
   name: 'Orange Cats',
   epicFilter: [ epicFilter ] }
```
You can then run jiractl commands using `cats` as the team name.

## Example usage

```
jiractl --team=cats [action] [context]
```

### Teams

Get teams for a project:
```console
$ jiractl get teams FOO
ID      TYPE    NAME
1234    scrum   Orange Cats
1111    scrum   Sharks
5678    kanban  Bats
```

Describe a team with velocity:
```console
$ jiractl describe team 1111
NAME       ID      TYPE
Sharks     2593    scrum

Velocity:
ID      NAME                    ESTIMATED       COMPLETED       DELTA
18465   Sharks 4/23 - 5/4       0               0               0
17071   Sharks 4/9 - 4/20       46              41              5
17047   Sharks 3/26 - 4/6       47              53              -6
17046   Sharks 3/12 - 3/23      41              34              7

Current Sprint: Sharks 4/23 - 5/4 ID: 18465

Backlog:

KEY             SUMMARY                                             POINTS
FOO-2911        As a shark ISBAT eat fish                           -
FOO-2910        As a shark ISBAT eat crustaceans                    -
FOO-2909        As a shark ISBAT participate in shark week          5
```

### Sprints

Get a team's sprints:

```console
$ jiractl --team=1111 get sprints
ID      STATE   NAME               VELOCITY
18465   open    Sharks 4/23-5/4    0
17071   closed  Sharks 4/9-4/20    41
17047   closed  Sharks 3/26-4/6    53
17046   closed  Sharks 3/12-3/23   34
```

Describe a specific sprint:

```console
$ jiractl --team=1111 describe sprint 18465
```

### Epics

Get a team's epics:

```console
$ jiractl --team=1111 get epics
```

Describe an epic:

```console
$ jiractl describe epic EPIC-KEY
```

### Issues

Get an issue:

```console
$ jiractl get issue ISSUE-KEY
```

Describe an issue:
```console
$ jiractl describe issue ISSUE-KEY
```

Update an issue:
```console
$ jiractl update issue ISSUE-KEY --points=8
```

Open an issue in the Jira UI:
```console
$ jiractl open ISSUE-KEY
```

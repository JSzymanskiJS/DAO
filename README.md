## Exercise

Create a governance contract that meets the requirements:

1. Admin contract creates voting with parameters (minimum votes, percentage number of votes required to settlement, start timestamp and end timestamp). Admin can update those parameters in the future.
2. Each address has only 1 vote -> For / Against / Abstain.
3. Summary for e.g rejected, accepted, not resolved with stats how much voted For / Against / Abstain.
4. [optional] Whitelist for addresses which can participate in voting.
5. [optional] Voting based on some ERC20 token balance.

# Examples of parameters

1. Minimum votes: 10
2. Percentage number of votes required to settlement: <0, 30> -rejected, (30, 70)-not resolved, <70, 100>-accepted
3. Start date: 1648569500
4. End date: 1648589500
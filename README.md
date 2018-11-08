## Delete linkedin connections easily

1. Run `npm install`
2. Update the delete.js file with the entire cookie your browser sends to linkedin
3. Put names of the people you want to delete into out.txt in this format:

```firstname:lastname
firstname 1:lastname 2
firstname 1:lastname 2
firstname 1:lastname 2
etc...
```

4. Run `npm start` 

It will notify you and pause execution if / when you hit the API limit which seems like about 1000 connections deleted per /day. Resets at midnight.

## Limitations

* Does not delete any non alpha numeric names - people with brackets or emojis in their name won't get deleted.
* This is not the most bullet proof thing in the world, some peopel will not be removed.
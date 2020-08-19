---
title: mastering_jq-bash_tricks
date:  July 15, 2020
tags: bash, jq, json, cli
...
# mastering jq: bash tricks
In this tutorial, we’ll demonstrate jq features that help us code bash faster.

Each section will present a feature in the following order

*   A brief description of the feature
    
*   A simple example you can copy and paste into your terminal
    
*   A sophisticated real world example of using the feature
    
*   A detailed explanation of the feature
    
*   Protips about how to use the feature effectively
    

The tutorial assumes basic knowledge of jq and bash.

Bash exit code
--------------

The -e flag changes jq’s bash exit code to depend on the program’s output.

### Examples

#### Simple

```
# succeeds (exit code 0)
echo '{"f": [0] }' | jq -e '.f | length == 1'

# fails (exit code 1)
echo '{"f": [] }' | jq -e '.f | length == 1'
```

#### Primitive log monitoring

```
# This notifies a specified user through a command "notify-user" if app.log has an error log line in the past 10 lines.
while true; do
  sleep 1
  tail app.log |
  jq -se 'map(select(.level == "ERROR")) != []' > /dev/null && notify-user adams "app.log has errors, please investigate" && break
done
```

### Detailed feature explanation

jq normally returns with exit code 0 if the jq program and and input data are valid, regardless of the program’s output.

Adding the -e flag causes jq to return with exit code 1 if the output is null or false and 0 otherwise. Below is a reference for which exit codes are returned under which conditions when using -e. The bold is simply to highlight the difference between when 0 and 1 are returned.

*   0, meaning success, if the jq program is valid, the input data is valid, **and the last json value returned by jq is neither null nor false**
    
*   1, meaning failure, if the jq program is valid, the input data is valid, **and the last json value returned by jq is null or false**
    
*   2, meaning an error, if the jq program is valid and the input data is not valid
    
*   3, meaning an error, if the jq program is not valid
    

### Protips

Makefiles, build systems, and bash files with "set -e" all fail if any line in the program or build fails. As such, we can use -e to make jq fail when it detects an invalid configuration file, data file, or even an invalid program output that’s json, and therefore make the entire build fail. This technique is quite useful in practice as jq makes json data validation very fast to implement.

Consider the following simple bash program:

```
a && b
```

b only runs if a returns status code 0. So, in:

```
... | jq -e '...' && b
```

b only runs if jq returns status code 0, which is when the last output is neither null nor false. As such, we can use jq to determine whether b should run. This technique is used in the primitive log monitor.

We can also use /dev/null to muffle jq’s output to avoid extraneous lines from being printed. This technique is used in the primitive log monitor

Single line output
------------------

jq -c makes jq output json as a single line

### Example

#### Simple

```
# outputs [0]
echo "[   0   ]" | jq -c '.'
```

#### Logging

```
# logs a logline as json to a newline delimited log file
echo "Updated the DB" |
jq -Rc '{"datetime": (now | todate), "level": "INFO", "message": .}' >> app.log
```

### Explanation

\-c means “compact output” which outputs the json without whitespace. As newlines are whitespace, this is a single line output.

### Protips

The main use of -c is logging as shown in the Logging example above. This can both be to an explicit logfile as well as stdout.

Diffable JSON
-------------

The -S flag makes jq output json that is diffable, (i.e. can be effectively compared using [diff](https://man7.org/linux/man-pages/man1/diff.1.html), the standard text comparison tool).

### Example

#### Simple

```
echo '{"b": 1, "c": 3, "a": 2}' | jq -S '.'
```

#### Demonstrate Diff

```
echo '{"a": 1, "b": 2}' | jq -S '.' > x.json
echo '{"b": 2,"a"   : 1}' | jq -S '.' > y.json
echo '{"a"          : 1, "b": 1}' | jq -S '.' > z.json

# outputs no difference
diff x.json y.json

# outputs a single line difference corresponding to a difference in b's value
diff y.json z.json

```

### Explanation

There are two reasons why jq -S makes data w diffable:

*   \-S means “sort dictionary keys” and combined with jq’s whitespace normalization means jq -S prints a unique textual representation of the json. All equivalent json values are printed exactly the same textually with jq -S. Even if the keys are in a different order. or there’s a difference in whitespace in the original values. Without sorting the keys or normalizing the whitespace, a textual different between two json values might suggest they’re different but semantically they’re the same.
    
*   jq’s standard pretty printing prints one line per array element and dictionary key. Therefore each semantic difference corresponds to at least a unique line difference in the text. For comparison, in compact mode, everything’s on one line, so all differences would also be on the same line. As such, diff’s output would only be useful for pointing out that the json values are different, not how they’re different.
    

### Protips

The main usecase for -S is diffing as shown in the 2nd example. An important special case of this is git. git diffs are textual diffs. If the json file is effectively diffable, then the diffs will be fast to read. If they’re not, then the diffs will be slow to read.

The other usecase for -S is to create a canonical output even when the file is not diffed. Canonical formats are less surprising for a reader and therefore faster to read.

Don’t play with arg or its cousins
----------------------------------

The previous sections have been about features that speed up our coding. This section is about a feature that slows down our coding.

arg - Pass in a value to jq through a CLI argument rather than stdin.

### Example

```
# This outputs 1
echo '[]' | jq --arg foo 1 '$foo'
```

There is no sophisticated example because it should not be used.

### Explanation

For each argument “foo” passed in as a CLI argument, its value gets mapped to $foo within jq.

### Protip

Don’t use arg or its cousins argjson, slurpfile, and argfile.

jq is fast to use in part because there’s one data pipeline that contains all program state. When debugging, viewing all of the program state is fast. If our program is:

```
cat data.json | jq 'filter1 | filter2 | filter3 ...' | …
```

Then to look at the input, we write:

```
cat data.json | jq '.' | less
```

Similarly, if we want to look at the program state after the first filter, we can do:

```
cat data.json | jq 'filter1' | less
```

or the second filter:

```
cat data.json | jq 'filter1 | filter2' | less
```

When we use "arg" to pass data into jq, it’s not through stdin which is the main pipeline, it’s through a "sidechannel". Plus, the data is stored in variables which themselves are not automatically printed by default. When we have to debug our program, viewing data from the main pipeline as well as a side channel is harder simply because there’s multiple sources. Multiple sources requires us to write more code correctly which unnecessarily slows us down and increases the risk of a mistake:

If our program is:

```
cat data.json | jq --arg foo $FOO --bar $BAR 'filter1 | filter2 | filter3...' | ...
```

Viewing the input data is slower because it requires writing a bit more code correctly to combine all of the sources:

```
cat data.json | jq "{foo: $FOO, bar: $BAR, data: .}" -C | less -R
```

We’ve seen how to use various jq features that will speed up our bash coding, including what we shouldn’t do.

# References
1. [https://codefaster.substack.com/p/mastering-jq-bash-tricks](https://codefaster.substack.com/p/mastering-jq-bash-tricks) 
   

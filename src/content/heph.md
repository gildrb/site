# Heph

![](media:heph-demo)

## Unchecked answers

Heph answers questions from the files in a folder and checks every quote that it cites against the source.

I studied with general AI assistants. Their mistakes looked plausible, and a mistake took longer to find than the answer saved. The first Heph, shown below, cited passages, but a ✓ only meant that Heph had retrieved the passage.

![](media:heph-interface)

## Checked quotes

Now each answer quotes its evidence, and Heph checks each quote against its passage. A small core in Bend ranks the passages and checks the quotes. Nine laws, such as "a quote marked ✓ is byte for byte in its passage", are proven in CI. Heph makes one model call per question instead of up to 27, gives the model no tools, and installs in 19 MiB instead of 46.

![](media:heph-answer)

## The typeface

I drew a typeface for Heph in Glyphs.

![](media:heph-typeface-early)

![](media:heph-typeface-refinement)

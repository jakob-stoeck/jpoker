#
#     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
#
#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
#
#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
SOUNDS = \
	player_arrive.ogg \
	player_hand.ogg

SWFS = $(SOUNDS:.ogg=.swf)
WAVS = $(SOUNDS:.ogg=.wav)

build : $(SWFS) $(WAVS)
	cp *.swf ../jpoker

clean:
	rm -f $(SWFS) $(WAVS) soundswiff
#	rm -f ../jpoker/*.swf

soundswiff: soundswiff.c
	gcc -Wall -o $@ $< -lming

license:
	for file in $(SOUNDS) ; do vorbiscomment $$file -w -c copyright.txt ; done

%.wav : %.ogg
	oggdec $<

%.swf : %.wav soundswiff
#	./soundswiff $< $@
	wav2swf --samplerate $(shell file $<  | perl -n -e '/(\d+)\sHz/; print $$1;') --output $@ --definesound  $<

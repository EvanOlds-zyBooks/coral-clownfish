import RandomSuggester from './suggesters/random';
import EvanOldsSuggester from './suggesters/EvanOldsSuggest.js';

// Reference your suggester class here using an import statment like above.

// Add a new instance of your suggester here. It will then show up in game. 
export default [ new RandomSuggester('Scott\'s randomizer'),
                new EvanOldsSuggester("Evan Olds - in order", "inorder"),
                new EvanOldsSuggester("Evan Olds - fish first", "fishfirst")];

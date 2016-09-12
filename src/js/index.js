var testES6 = () => {
	for(let i = 0; i < 10; i++){
		setTimeout( () => {console.log(i);}, 10);
	}
};

testES6();

var $ =  require('jQuery');
$( () => {
	$('.block').css('color', '#462');
});
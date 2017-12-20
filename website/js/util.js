
function date_or_null(d) {
	if(d == null) return d;
	return new Date(d);
}
function argmin(arr)
{
	var i = -1;
	var m = null;

	for (j = 0; j < arr.length; j++) { 
		if(arr[j] == null) continue;

		if(m == null) {
			i = j;
			m = arr[j];
			continue;
		}

		if(arr[j] < m) {
			i = j;
			m = arr[j];
		}
	}
	return i;
}


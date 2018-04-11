import tasks

def breakpoint(): import pdb;pdb.set_trace();

class Task:    
    column_width = {'title': 48}
    
    def __init__(self, session, d):
        self.session = session
        self.__d = d

        if 'status' in d:
            for e in d['status']:
                if isinstance(e['value'], str):
                    #breakpoint()
                    pass

    def __getitem__(self, key):
        if key == 'status':
            pass
            #breakpoint()

        return self.__d[key]
    
    def __setitem__(self, key, value):
        if key == 'status':
            pass
            #breakpoint()

        self.__d[key] = value
    
    def get(self, key, default):
        if key == 'status':
            #breakpoint()
            pass

        return self.__d.get(key, default)

    @property
    def due(self):
        # TODO consider descriptor that would update DB on set
        if 'due_last' in self.__d: return self.__d['due_last']
        if 'due' in self.__d: return self.__d['due'][-1]['value']
        raise Exception('cannot find due datetime')

    @property
    def status(self):
        # TODO consider descriptor that would update DB on set
        if 'status_last' in self.__d:
            return self.__d['status_last']

        if 'status' in self.__d: 
            return self.__d['status'][-1]['value']

        raise Exception('cannot find status')

    def __lt__(self, other):
        if other['due_last'] is None: return True
        if self.__d['due_last'] is None: return False
        return self.__d['due_last'] < other['due_last']

    def posts(self):
        for post in self.__d.get("posts", []):
            yield tasks.SafePost(self.session, post)
    
    def due_str(self):
        due = self.__d['due_last']
        #due_str = '{:26s}'.format(datetimeToString(due))
        
        if due:
            due = pytz.utc.localize(due)
            due_str = '{:26s}'.format(datetimeToString(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = '{:26s}'.format('')
        
        return due_str

    def status_str(self):
        s = Status(self.__d.get('status_last',0))
        return '{:11s}'.format(s.name)



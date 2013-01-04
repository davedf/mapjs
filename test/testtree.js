 function test_tree(){
    return {
              title: 'Node 1',
              ideas: {
                1: { title: 'Node 1.1',
                     ideas: {
                       1: {title: 'Node 1.1.1'},
                       2: {title: 'Node 1.1.2'},
                       1.5: {title: 'Node 1.1.3'}
                     }
                   },
                2: { title: 'Node 1.2',
                     ideas: {
                       1: {title: 'Node 1.2.1'},
                       2: {title: 'Node 1.2.2',
                          ideas: {
                            1: {title: 'Node 1.2.2.1'},
                            2: {title: 'Node 1.2.2.2'},
                            3: {title: 'Node 1.2.2.3'}
                            }
                          },
                       3: {title: 'Node 1.2.3'}
                     }
                   },
                3: {title: 'Node 1.3'},
                '-1': { title: 'Node 1.4',
                     ideas: {
                       1: {title: 'Node 1.4.1'},
                       2: {title: 'Node 1.4.2'},
                       3: {title: 'Node 1.4.3'}
                     }
                   },
                '6': { title: 'Node 1.5',
                     ideas: {
                       1: {title: 'Node 1.5.1'},
                       2: {title: 'Node 1.5.2',
                          ideas: {
                            1: {title: 'Node 1.5.2.1'},
                            2: {title: 'Node 1.5.2.2'},
                            3: {title: 'Node 1.5.2.3'}
                            }
                          },
                          3: {title: 'Node 1.5.3 Mozilla is a \nfree software community best known \nfor producing the Firefox web browser. The Mozilla community \nuses, develops, spreads and supports Mozilla products \nand works to advance the goals of the Open Web described in the Mozilla Manifesto.[1] \nThe community is supported institutionally by the Mozilla Foundation and its tax-paying subsidiary, \nthe Mozilla Corporation.[2] '}
                     }
                   },
                '-3': {title: 'Node 1.6'}
              }
          }
}

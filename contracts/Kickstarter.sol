pragma solidity >=0.8.0;

contract Kickstarter {
  
  uint public totalProject;
  mapping(uint => Project) public projects;

  struct Project{
    uint id; 
    string title;
    string description;
    uint votes;
  }

  constructor() {
    totalProject = 0;
  }
  
  function getTotalProjects() public view returns(uint){
    return totalProject;
  }

  function createProject(string memory _title,string memory _description) public{
      require(bytes(_title).length > 3 ,"Project title must be at least 3 chars long");
      require(bytes(_description).length > 3 ,"Project description must be at least 3 chars long");
      totalProject += 1;
      projects[totalProject] = Project(totalProject,_title,_description,0);

  }

  function vote(uint _projectId) public{
    require(projects[_projectId].id != 0,"Project doesn't exist");

    projects[_projectId].votes += 1;

  }

  
}